import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
  criteria: z
    .object({
      cleanliness: z.number().int().min(1).max(5).optional(),
      sauna: z.number().int().min(1).max(5).optional(),
      service: z.number().int().min(1).max(5).optional(),
      accuracy: z.number().int().min(1).max(5).optional(),
      value: z.number().int().min(1).max(5).optional(),
    })
    .optional(),
  photos: z.array(z.string().min(1)).optional(),
});

export const respondReviewSchema = z.object({
  response: z.string().min(5).max(500),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type RespondReviewInput = z.infer<typeof respondReviewSchema>;
