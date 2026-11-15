import { NextRequest, NextResponse } from "next/server";
import { isAllowedAdminRole } from "@/shared/middlewares/require-auth";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

const ALLOWED_ROLES = ["superadmin", "marketing", "content", "moderator"];

async function requireAdmin(req: NextRequest) {
  const user = await getSession(req);
  if (!user || user.role !== "ADMIN" || !isAllowedAdminRole(user.adminRole, ALLOWED_ROLES)) return null;
  return user;
}

/** Все справочники платформы. */
export async function GET(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return apiError("FORBIDDEN", "Admin required", 403);

  const [cities, amenities, districts, objectTypes] = await Promise.all([
    prisma.city.findMany({ orderBy: { name: "asc" } }),
    prisma.amenity.findMany({ orderBy: { name: "asc" } }),
    prisma.district.findMany({
      include: { city: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.objectType.findMany({ orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({ data: { cities, amenities, districts, objectTypes } });
}

/** Создание записи справочника: type = city | amenity | district | objectType. */
export async function POST(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return apiError("FORBIDDEN", "Admin required", 403);

  const body = await req.json().catch(() => ({}));
  const type = body.type as string | undefined;
  const name = (body.name as string | undefined)?.trim();
  if (!type || !name) {
    return apiError("VALIDATION_ERROR", "type и name обязательны", 400);
  }

  const TRANSLIT: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  const slugify = (value: string) =>
    value
      .toLowerCase()
      .split("")
      .map((ch) => TRANSLIT[ch] ?? ch)
      .join("")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  try {
    if (type === "city") {
      const slug = (body.slug as string | undefined)?.trim() || slugify(name);
      const item = await prisma.city.create({ data: { name, slug } });
      return apiSuccess(item, undefined, 201);
    }
    if (type === "amenity") {
      const slug = (body.slug as string | undefined)?.trim() || slugify(name);
      const item = await prisma.amenity.create({ data: { name, slug, icon: body.icon || null } });
      return apiSuccess(item, undefined, 201);
    }
    if (type === "district") {
      const cityId = body.cityId as string | undefined;
      if (!cityId) return apiError("VALIDATION_ERROR", "cityId обязателен для района", 400);
      const item = await prisma.district.create({ data: { name, cityId } });
      return apiSuccess(item, undefined, 201);
    }
    if (type === "objectType") {
      const slug = (body.slug as string | undefined)?.trim() || slugify(name);
      const item = await prisma.objectType.create({ data: { name, slug } });
      return apiSuccess(item, undefined, 201);
    }
    return apiError("VALIDATION_ERROR", "Неизвестный тип справочника", 400);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return apiError("DUPLICATE", "Запись с таким slug уже существует", 409);
    }
    console.error("POST /api/v1/admin/refs failed", err);
    return apiError("INTERNAL_ERROR", "Не удалось создать запись", 500);
  }
}

/** Удаление записи справочника: ?type=city|amenity|district|objectType&id=... */
export async function DELETE(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return apiError("FORBIDDEN", "Admin required", 403);

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  if (!type || !id) return apiError("VALIDATION_ERROR", "type и id обязательны", 400);

  try {
    if (type === "city") await prisma.city.delete({ where: { id } });
    else if (type === "amenity") await prisma.amenity.delete({ where: { id } });
    else if (type === "district") await prisma.district.delete({ where: { id } });
    else if (type === "objectType") await prisma.objectType.delete({ where: { id } });
    else return apiError("VALIDATION_ERROR", "Неизвестный тип справочника", 400);
    return apiSuccess({ success: true });
  } catch (err: any) {
    if (err?.code === "P2003") {
      return apiError("IN_USE", "Запись используется и не может быть удалена", 409);
    }
    console.error("DELETE /api/v1/admin/refs failed", err);
    return apiError("INTERNAL_ERROR", "Не удалось удалить запись", 500);
  }
}
