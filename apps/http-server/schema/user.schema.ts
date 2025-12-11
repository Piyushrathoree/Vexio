import * as z from "zod";

const NewUser = z.object({
    name: z.string().min(1).max(20),
    email: z.string().email(),
    password: z
        .string()
        .min(8)
        .max(20)
        .regex(
            /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
            "Password must contain at least one letter and one number"
        ),
});

const ExistingUser = z.object({
    email: z.string().email(),
    password: z
        .string()
        .min(8)
        .max(20)
        .regex(
            /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
            "Password must contain at least one letter and one number"
        ),
});

export { NewUser, ExistingUser };
