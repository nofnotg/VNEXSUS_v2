import { z } from "zod";
import { userRoles, userStatuses } from "../constants/roles";

export const sessionUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  role: z.enum(userRoles),
  status: z.enum(userStatuses)
});

export type SessionUser = z.infer<typeof sessionUserSchema>;
