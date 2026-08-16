import nodemailer, { type Transporter } from "nodemailer";
import { emailLayout } from "./email-templates";

let mailTransporter: Transporter | null = null;
let warnedMissingConfig = false;

const getMailTransporter = (): Transporter | null => {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
        if (!warnedMissingConfig) {
            console.warn(
                "[email] SMTP_USER or SMTP_PASS is not set — emails will not be sent. " +
                    "Configure a Gmail address and Google App Password to enable email delivery."
            );
            warnedMissingConfig = true;
        }
        return null;
    }

    if (!mailTransporter) {
        mailTransporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user, pass },
        });
    }

    return mailTransporter;
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
    const transporter = getMailTransporter();

    // Gracefully no-op when Gmail isn't configured so signup/reset flows
    // never fail just because email delivery isn't set up (e.g. local dev).
    if (!transporter) {
        return;
    }

    const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;

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
        await transporter.sendMail({
            from,
            to,
            subject,
            html: resolvedHtml,
            text,
        });
    } catch (err) {
        console.error("Failed to send email:", err);
    }
};
