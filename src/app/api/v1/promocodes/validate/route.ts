import { NextRequest } from "next/server";
import { requireAuth } from "@/shared/middlewares/require-auth";
import { apiSuccess, apiError } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";
import { validatePromoCode } from "@/modules/promocodes/promo.service";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const body = await req.json();
    const { code, amount } = body;
    
    if (!code) throw new HttpError("INVALID_REQUEST", "code is required", 400);
    if (amount === undefined) throw new HttpError("INVALID_REQUEST", "amount is required", 400);

    const result = await validatePromoCode(code, session.sub, amount);
    return apiSuccess(result);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("POST /api/v1/promocodes/validate failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
