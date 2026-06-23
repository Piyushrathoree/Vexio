import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({
    to,
    subject,
    text,
}: {
    to: string;
    subject: string;
    text: string;
}) => {
    if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is not configured");
    }

    const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "Vexio <onboarding@resend.dev>",
        to,
        subject,
        text,
    });

    if (error) {
        console.error("Failed to send email:", error);
        throw new Error("Failed to send email");
    }
};
