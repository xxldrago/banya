import { z } from "zod";

export const cityResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  timezone: z.string(),
});

export type CityResponse = z.infer<typeof cityResponseSchema>;
