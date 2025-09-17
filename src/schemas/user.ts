import z from "zod";
import { preferredLanguageSchema } from "@/schemas/common";

export const patchUserSchema = z.object({
  emojiClickedCount: z.number().min(0, 'Emoji clicked count must be at least 0').optional(),
  firstName: z.string().min(2, 'First name is required').optional(),
  lastName: z.string().min(2, 'Last name is required').optional(),
  preferredLanguage: preferredLanguageSchema.optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
}).refine(data => {
  // If firstName is provided, lastName must also be provided, and vice versa
  if (data.firstName !== undefined && data.lastName === undefined) {
    return false;
  }
  if (data.lastName !== undefined && data.firstName === undefined) {
    return false;
  }

  return true;
}, {
  message: 'Both firstName and lastName must be provided together when updating names'
});