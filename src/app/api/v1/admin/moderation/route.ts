import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";
import { isAllowedAdminRole } from "@/shared/middlewares/require-auth";

const MODELS = {
  banner: prisma.banner,
  collection: prisma.collection,
  seoPage: prisma.seoPage,
} as const;

type ContentType = keyof typeof MODELS;

function requireModerator(req: NextRequest) {
  return getSession(req).then((user) => {
    if (!user || user.role !== "ADMIN") return null;
    if (!isAllowedAdminRole(user.adminRole, ["superadmin", "moderator", "content", "marketing"])) return null;
    return user;
  });
}

/** Moderation queue: all PENDING banners/collections/SEO pages. */
export async function GET(req: NextRequest) {
  const user = await requireModerator(req);
  if (!user) return apiError("FORBIDDEN", "Moderator access required", 403);

  const [banners, collections, seoPages] = await Promise.all([
    prisma.banner.findMany({ where: { moderationStatus: "PENDING" }, orderBy: { updatedAt: "desc" } }),
    prisma.collection.findMany({ where: { moderationStatus: "PENDING" }, orderBy: { updatedAt: "desc" } }),
    prisma.seoPage.findMany({ where: { moderationStatus: "PENDING" }, orderBy: { updatedAt: "desc" } }),
  ]);
  return apiSuccess({ banners, collections, seoPages });
}

/** Approve or reject a pending content item. */
export async function POST(req: NextRequest) {
  const user = await requireModerator(req);
  if (!user) return apiError("FORBIDDEN", "Moderator access required", 403);

  const body = await req.json();
  const { type, id, decision } = body || {};
  if (!type || !id || !decision) {
    return apiError("VALIDATION_ERROR", "type, id and decision required", 400);
  }
  if (!["APPROVED", "REJECTED"].includes(decision)) {
    return apiError("VALIDATION_ERROR", "decision must be APPROVED or REJECTED", 400);
  }
  const model = MODELS[type as ContentType];
  if (!model) return apiError("VALIDATION_ERROR", "Unknown content type", 400);

  const data = { moderationStatus: decision as string };
  const item =
    type === "banner"
      ? await prisma.banner.update({ where: { id }, data })
      : type === "collection"
        ? await prisma.collection.update({ where: { id }, data })
        : await prisma.seoPage.update({ where: { id }, data });
  return apiSuccess(item);
}
