import { z } from "zod";

export const SendMessageSchema = z.object({
  body: z
    .string()
    .max(2000, "Message body must be at most 2000 characters")
    .optional()
    .default(""),
  attachments: z
    .array(
      z.object({
        url: z.string().min(1),
        type: z.string().min(1),
        name: z.string().optional(),
        size: z.number().int().optional(),
      }),
    )
    .optional(),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export const ListMessagesQuerySchema = z.object({
  limit: z
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(200, "Limit must be at most 200")
    .default(50),
  cursor: z.string().optional(),
});

export type ListMessagesQuery = z.infer<typeof ListMessagesQuerySchema>;

export const GetConversationSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
});

export type GetConversationInput = z.infer<typeof GetConversationSchema>;