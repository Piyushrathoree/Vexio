import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";
import "@repo/common";
import { client } from "@repo/db";
import { sendEmail } from "./email";
import { passwordResetEmailTemplate, verificationEmailTemplate } from "./email-templates";

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
    // In production the web app and auth API live on different subdomains of
    // a shared parent domain, so session cookies must be scoped to the parent
    // domain (e.g. ".vexio.com") for Next.js middleware to see them. Gated on
    // COOKIE_DOMAIN so local dev (web + API both on localhost) is unaffected.
    ...(process.env.COOKIE_DOMAIN
        ? {
              advanced: {
                  crossSubDomainCookies: {
                      enabled: true,
                      domain: process.env.COOKIE_DOMAIN,
                  },
              },
          }
        : {}),
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            const { subject, html, text } = verificationEmailTemplate(url);
            void sendEmail({
                to: user.email,
                subject,
                html,
                text,
            }).catch((err) => {
                console.error("Failed to send verification email:", err);
            });
        },
    },
    emailAndPassword: {
        enabled: true,
        // NOTE: off for local dev so login works without email delivery configured.
        // Now that email delivery goes through Resend (see email.ts), this can be
        // flipped to `true` once RESEND_API_KEY / RESEND_FROM_EMAIL are confirmed
        // working in the target environment — otherwise users can't verify their
        // email and real-time will break.
        requireEmailVerification: false,
        autoSignIn: false,
        sendResetPassword: async ({ user, url }) => {
            try {
                const { subject, html, text } = passwordResetEmailTemplate(url);
                await sendEmail({
                    to: user.email,
                    subject,
                    html,
                    text,
                });
            } catch (err) {
                // Mirror the verification path's resilience: a mail failure here
                // should never 500 the auth handler.
                console.error("Failed to send password reset email:", err);
            }
        },
    },
    socialProviders,
    plugins: [bearer()],
});
