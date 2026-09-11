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
        // Email delivery goes through Gmail via Nodemailer (see email.ts). This
        // can be flipped to `true` once SMTP_USER / SMTP_PASS are confirmed
        // working in the target environment — otherwise users can't verify
        // their email and real-time will break.
        requireEmailVerification: false,
        // Sign-up creates the session straight away (cookie + `set-auth-token`)
        // so the client can land on /rooms. This also decides what a duplicate
        // email gets back: with `autoSignIn: false` (or verification required)
        // better-auth answers sign-up for an existing email with a *generic
        // 200 and a synthetic user* to avoid account enumeration — the UI
        // then says "account created" when nothing happened and the password
        // just typed doesn't work. With it on, duplicates get a real 422
        // `USER_ALREADY_EXISTS` the form can show.
        autoSignIn: true,
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
