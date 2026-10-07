import { z } from "zod";

z.config({ jitless: true });

export const EmailResultsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  calcType: z.string().trim().min(1).max(100),
  shareUrl: z.string().trim().min(1).max(2048),
  marketingOptIn: z.boolean().optional().default(false),
});

export function isEnabled(): boolean {
  return (
    Boolean(process.env.EMAIL_CAPTURE_ENDPOINT) &&
    process.env.NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED === "1" &&
    Boolean(process.env.NEXT_PUBLIC_POSTAL_ADDRESS?.trim())
  );
}
