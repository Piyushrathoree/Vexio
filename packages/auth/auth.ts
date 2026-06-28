import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";
import "@repo/common";
import { client } from "@repo/db";
import { sendEmail } from "./email";

const webUrl = process.env.WEB_URL ?? "http://localhost:3001";

const socialProviders: Record<string, { clientId: string; clientSecret: string }> =
    {};

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    socialProviders.github = {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
    };
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
}

export const auth = betterAuth({
    database: prismaAdapter(client, {
        provider: "postgresql",
    }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: [webUrl],
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            void sendEmail({
                to: user.email,
                subject: "Verify your Vexio email",
                text: `Click to verify your email: ${url}`,
            }).catch((err) => {
                console.error("Failed to send verification email:", err);
            });
        },
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        autoSignIn: false,
        sendResetPassword: async ({ user, url }) => {
            await sendEmail({
                to: user.email,
                subject: "Reset your Vexio password",
                text: `Click to reset your password: ${url}`,
            });
        },
    },
    socialProviders,
    plugins: [bearer()],
});
