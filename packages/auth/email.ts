import nodemailer from "nodemailer";

const getTransporter = () => {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
        throw new Error("SMTP_USER and SMTP_PASS are not configured");
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST ?? "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user, pass },
    });
};

export const sendEmail = async ({
    to,
    subject,
    text,
}: {
    to: string;
    subject: string;
    text: string;
}) => {
    const from =
        process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "Vexio <noreply@localhost>";

    const transporter = getTransporter();

    try {
        await transporter.sendMail({ from, to, subject, text });
    } catch (err) {
        console.error("Failed to send email:", err);
        throw new Error("Failed to send email");
    }
};
