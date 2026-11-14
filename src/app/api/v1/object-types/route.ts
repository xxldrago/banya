import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/shared/lib/api-response";

export async function GET(req: NextRequest) {
  const types = await prisma.objectType.findMany({ orderBy: { name: "asc" } });
  return apiSuccess(types);
}
