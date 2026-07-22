import { Resend } from "resend";
import { emailLayout } from "./email-templates";

let resendClient: Resend | null = null;
let warnedMissingKey = false;

const getResendClient = (): Resend | null => {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        if (!warnedMissingKey) {
            console.warn(
                "[email] RESEND_API_KEY is not set — emails will not be sent. " +
                    "Configure RESEND_API_KEY and RESEND_FROM_EMAIL to enable email delivery.",
            );
            warnedMissingKey = true;
        }
        return null;
    }

    if (!resendClient) {
        resendClient = new Resend(apiKey);
    }

    return resendClient;
};

export const sendEmail = async ({
    to,
    subject,
    text,
    html,
}: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}) => {
    const client = getResendClient();

    // Gracefully no-op when Resend isn't configured so signup/reset flows
    // never fail just because email delivery isn't set up (e.g. local dev).
    if (!client) {
        return;
    }

    const from = process.env.RESEND_FROM_EMAIL ?? "Vexio <onboarding@resend.dev>";

    // Fall back to the generic branded layout when a caller only provides
    // plain text (no dedicated template was built for that email).
    const resolvedHtml =
        html ??
        emailLayout({
            title: subject,
            heading: subject,
            bodyHtml: text ?? "",
            ctaLabel: "Open Vexio",
            ctaUrl: process.env.WEB_URL ?? "http://localhost:3001",
        });

    try {
        const { error } = await client.emails.send({
            from,
            to,
            subject,
            html: resolvedHtml,
            text,
        });

        if (error) {
            console.error("Failed to send email:", error);
        }
    } catch (err) {
        console.error("Failed to send email:", err);
    }
};
