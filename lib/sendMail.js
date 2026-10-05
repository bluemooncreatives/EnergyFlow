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
 * text-only client shows. Best-effort, but the order of these passes matters:
 *
 *  1. Conditional comments go first — the Outlook-only VML inside every CTA
 *     repeats the button label, which would otherwise appear twice.
 *  2. Anchors keep their href as "label (url)", so a text-only reader can still
 *     verify an email, track a parcel or unsubscribe.
 *  3. Block ends become newlines, then whitespace-only lines are dropped — the
 *     table scaffolding otherwise leaves dozens of blank lines between
 *     sentences.
 */
const htmlToText = (html = "") =>
    String(html)
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<head[\s\S]*?<\/head>/gi, " ")
        // Outlook-only markup (the VML button, OfficeDocumentSettings): a
        // downlevel-HIDDEN block, dropped whole so the button label — which the
        // VML repeats — is not emitted twice. The negative lookahead keeps this
        // off the `[if !mso]` wrapper below.
        .replace(/<!--\[if\s+(?!!)[\s\S]*?<!\[endif\]-->/gi, " ")
        // The matching downlevel-REVEALED wrapper holds the real anchor, so only
        // its markers come out; the anchor itself is kept for the pass below.
        .replace(/<!--\[if\s+![\s\S]*?\]>\s*<!-*>/gi, " ")
        .replace(/<!--\s*<!\[endif\]-->/gi, " ")
        // Anything left that is a comment (e.g. the section markers).
        .replace(/<!--[\s\S]*?-->/g, " ")
        // Keep link targets. Skips mailto:/tel: and self-describing links whose
        // text already is the URL.
        .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_match, href, text) => {
            const inner = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            if (!href || href === "#" || /^(mailto:|tel:)/i.test(href)) return inner;
            if (!inner || inner === href) return href;
            return `${inner} (${href})`;
        })
        .replace(/<\/(p|div|tr|h1|h2|h3|li)>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&zwnj;/gi, "")
        .replace(/[^\S\n]+/g, " ")
        // Drop lines that are now only whitespace, then allow at most one blank
        // line between blocks.
        .replace(/^ +$/gm, "")
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
 * @param {object} [opts.headers]      Extra headers (e.g. List-Unsubscribe on newsletter mail)
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
        ...(opts.headers ? { headers: opts.headers } : {}),
    };

    try {
        await getTransporter().sendMail(options);
        return { success: true };
    } catch (error) {
        console.error("Mail send failed:", error?.message || error);
        return { success: false, message: error?.message || "Failed to send email." };
    }
};
