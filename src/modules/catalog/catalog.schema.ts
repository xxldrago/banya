import { z } from "zod";
import { paginationSchema } from "@/shared/validation/pagination";

export const catalogQuerySchema = paginationSchema.extend({
  cityId: z.string().min(1, "cityId required"),
  type: z.enum(["bath", "sauna"]).optional(),
  minGuests: z.coerce.number().int().min(1).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  // Multiple amenityIds can be passed as repeated query params
  amenityId: z.preprocess(
    (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string" && val.length > 0) return [val];
      return undefined;
    },
    z.array(z.string()).optional(),
  ),
  district: z.string().optional(),
  metroStation: z.string().optional(),
  objectType: z.string().optional(),
  sort: z.enum(["price_asc", "price_desc", "newest"]).default("newest"),
});

export type CatalogQueryParams = z.infer<typeof catalogQuerySchema>;

export const mapQuerySchema = z.object({
  cityId: z.string().min(1, "cityId required"),
});
