import nodemailer from "nodemailer";

/**
 * Single shared SMTP transport. Created lazily so that importing this module
 * (which Next.js may do at build time or in the edge-adjacent runtime) never
 * eagerly opens a socket. Connection/greeting/socket timeouts are bounded so a
 * hung SMTP server can never stall an API route indefinitely — the send fails
 * fast and the caller decides what to do.
 */
let transporter = null;

const getTransporter = () => {
    if (transporter) return transporter;

    transporter = nodemailer.createTransport({
        host: process.env.NODEMAILER_HOST,
        port: Number(process.env.NODEMAILER_PORT) || 587,
        secure: Number(process.env.NODEMAILER_PORT) === 465, // implicit TLS only on 465
        auth: {
            user: process.env.NODEMAILER_EMAIL,
            pass: process.env.NODEMAILER_PASSWORD,
        },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
        pool: true,
        maxConnections: 3,
    });

    return transporter;
};

/**
 * Derive a plaintext fallback from the HTML body. Multipart text/plain markedly
 * improves deliverability (spam filters penalise HTML-only mail) and is what a
 * text-only client shows. Best-effort: strips tags and collapses whitespace.
 */
const htmlToText = (html = "") =>
    String(html)
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<head[\s\S]*?<\/head>/gi, " ")
        .replace(/<\/(p|div|tr|h1|h2|h3|li)>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&zwnj;/gi, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

/**
 * Send a transactional email. Never throws — returns a result object so callers
 * can decide whether a mail failure should surface to the user (e.g. "we sent
 * you a code") or be silently logged (e.g. an order is already saved).
 *
 * @param {string} subject
 * @param {string|string[]} receiver
 * @param {string} body                HTML body
 * @param {object} [opts]
 * @param {string} [opts.replyTo]      Reply-To header (used by the contact form)
 * @param {string} [opts.text]         Explicit plaintext part; auto-derived if omitted
 */
export const sendMail = async (subject, receiver, body, opts = {}) => {
    if (!receiver) {
        return { success: false, message: "No recipient specified." };
    }
    if (!process.env.NODEMAILER_EMAIL || !process.env.NODEMAILER_HOST) {
        console.error("sendMail: SMTP env vars are not configured.");
        return { success: false, message: "Email service is not configured." };
    }

    const options = {
        from: `"Energyflow" <${process.env.NODEMAILER_EMAIL}>`,
        to: receiver,
        subject,
        html: body,
        text: opts.text || htmlToText(body),
        ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    };

    try {
        await getTransporter().sendMail(options);
        return { success: true };
    } catch (error) {
        console.error("Mail send failed:", error?.message || error);
        return { success: false, message: error?.message || "Failed to send email." };
    }
};
