import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/shared/lib/api-response";
import { cached } from "@/shared/lib/cache";

export async function GET(req: NextRequest) {
  const types = await cached("ref:object-types", 300, () => prisma.objectType.findMany({ orderBy: { name: "asc" } }));
  return apiSuccess(types);
}
