import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
});

export const respondReviewSchema = z.object({
  response: z.string().min(5).max(500),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type RespondReviewInput = z.infer<typeof respondReviewSchema>;
