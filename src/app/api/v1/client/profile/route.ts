import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";

/** Flatten user + profile into one object (backwards-compatible API shape). */
function flatten(u: any) {
  return {
    ...u,
    firstName: u.profile?.firstName ?? null,
    lastName: u.profile?.lastName ?? null,
    birthDate: u.profile?.birthDate ?? null,
    avatarUrl: u.profile?.avatarUrl ?? null,
    profile: undefined,
  };
}

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const u = await prisma.user.findUnique({
    where: { id: user.sub },
    include: { profile: true },
  });
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: flatten(u) });
}

export async function PATCH(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Account fields live on User, personal fields on UserProfile.
  const userAllowed = ["phone", "email"];
  const profileAllowed = ["firstName", "lastName", "birthDate", "avatarUrl"];
  const userData: any = {};
  const profileData: any = {};
  for (const k of [...userAllowed, ...profileAllowed]) {
    if (body[k] === undefined) continue;
    if (k === "birthDate") {
      if (body[k]) profileData[k] = new Date(body[k]);
    } else if (userAllowed.includes(k)) {
      userData[k] = body[k];
    } else {
      profileData[k] = body[k];
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.sub },
    data: {
      ...(Object.keys(userData).length ? userData : {}),
      ...(Object.keys(profileData).length
        ? {
            profile: {
              upsert: {
                create: profileData,
                update: profileData,
              },
            },
          }
        : {}),
    },
    include: { profile: true },
  });

  return NextResponse.json({ data: flatten(updated) });
}
