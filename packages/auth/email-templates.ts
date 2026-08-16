/**
 * Minimal, inline-styled HTML email templates branded as "Vexio".
 * Kept dependency-free (no MJML/React email) so they can be sent as-is via Nodemailer.
 */

const BRAND_COLOR = "#6d28d9";

type LayoutOptions = {
    title: string;
    heading: string;
    bodyHtml: string;
    ctaLabel: string;
    ctaUrl: string;
    footerHtml?: string;
};

/**
 * Generic branded wrapper used both by the specific templates below and as a
 * fallback in email.ts for any ad-hoc email that only provides plain text.
 */
export const emailLayout = ({
    title,
    heading,
    bodyHtml,
    ctaLabel,
    ctaUrl,
    footerHtml,
}: LayoutOptions) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color:${BRAND_COLOR};padding:24px 32px;">
                <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Vexio</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:20px;color:#111827;">${heading}</h1>
                <div style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">${bodyHtml}</div>
                <a href="${ctaUrl}" style="display:inline-block;background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:8px;">${ctaLabel}</a>
                <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;word-break:break-all;">If the button doesn't work, copy and paste this link into your browser:<br /><a href="${ctaUrl}" style="color:${BRAND_COLOR};">${ctaUrl}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;color:#9ca3af;">${
                    footerHtml ??
                    "You're receiving this email because an action was requested on your Vexio account. If this wasn't you, you can safely ignore this email."
                }</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export type EmailContent = { subject: string; html: string; text: string };

export const verificationEmailTemplate = (url: string): EmailContent => ({
    subject: "Verify your Vexio email",
    text: `Confirm your email address for Vexio by visiting: ${url}`,
    html: emailLayout({
        title: "Verify your Vexio email",
        heading: "Confirm your email address",
        bodyHtml:
            "Welcome to Vexio! Please confirm your email address to finish setting up your account and start collaborating on the whiteboard.",
        ctaLabel: "Verify email",
        ctaUrl: url,
    }),
});

export const passwordResetEmailTemplate = (url: string): EmailContent => ({
    subject: "Reset your Vexio password",
    text: `Reset your Vexio password by visiting: ${url}`,
    html: emailLayout({
        title: "Reset your Vexio password",
        heading: "Reset your password",
        bodyHtml:
            "We received a request to reset the password for your Vexio account. Click the button below to choose a new password. This link will expire soon, so please use it right away.",
        ctaLabel: "Reset password",
        ctaUrl: url,
        footerHtml:
            "You're receiving this email because a password reset was requested for your Vexio account. If this wasn't you, you can safely ignore this email.",
    }),
});
