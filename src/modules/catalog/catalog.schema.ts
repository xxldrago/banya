import { z } from "zod";
import { paginationSchema } from "@/shared/validation/pagination";

export const catalogQuerySchema = paginationSchema.extend({
  cityId: z.string().min(1, "cityId required"),
});

export type CatalogQueryParams = z.infer<typeof catalogQuerySchema>;
