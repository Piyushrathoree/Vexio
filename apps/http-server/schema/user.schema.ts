import * as z from "zod";

const NewUser = z.object({
  fullName: z.string().max(20).optional(),
  email: z.email(),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)
    .max(20),
});

const ExistingUser = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)
    .max(20),
});

export {NewUser , ExistingUser}
