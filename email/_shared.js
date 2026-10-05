/* ================================================================
   ENERGYFLOW — EMAIL DESIGN SYSTEM (shared)
   Single source of truth for every transactional email.

   Email clients strip <style> custom properties and most of modern CSS,
   so every value here is a literal, inline-able constant and every
   layout primitive is table-based with inline styles.

   Tokens mirror the app's "Live green" palette in app/design-system.css
   (pine ink, forest accent, sunflower highlight, cream canvas, olive
   secondary) but are hard-coded because CSS vars don't survive in
   Gmail / Outlook / Apple Mail.

   Canonical token names now match the design system (pine, forest, sun,
   cream, olive). The older keys (oxblood, crimson, warm) are kept as
   aliases on the same literals so any outside caller keeps working.

   Templates compose the primitives at the bottom of this file rather
   than hand-rolling tables — that is what keeps spacing, type scale and
   colour roles identical across all thirteen emails.
   ================================================================ */

import { INSTAGRAM_URL, FACEBOOK_URL, X_URL } from "@/lib/socialLinks";

// ── Brand palette (cream + pine + forest + sunflower + olive) ──
export const BRAND = {
    // Canonical names (match --brand-* in app/design-system.css)
    pine: "#0B3D2E", // headings, footer band, CTAs, code
    pineDeep: "#072A20",
    forest: "#2F6B3F", // links, eyebrows, active dots, success
    sun: "#F2C94C", // highlight bands, badges, coupon tickets
    sunInk: "#0B3D2E", // text on a sunflower fill (7.7:1)
    cream: "#F7F3E8", // page ground, inset panels, text on dark bands
    sand: "#F0EBDB", // deeper warm neutral (--brand-warm-bg)
    olive: "#8C7A3B", // secondary marks
    oliveDeep: "#6B5C27", // olive text on cream (6:1)
    ink: "#0A2F24", // deep green near-black
    body: "#34453C", // --text-body
    white: "#FFFFFF",
    border: "#E3DDCB", // soft hairline
    borderStrong: "#D3CCB2",
    muted: "#5A6A5F", // green-grey label
    success: "#2F6B3F",
    danger: "#B3261E", // security warnings must still read as alerts
    dangerSoft: "#FDECEA",

    // ── Legacy aliases (kept so any older caller still compiles) ──
    oxblood: "#0B3D2E", // → pine
    crimson: "#2F6B3F", // → forest
    warm: "#F7F3E8", // → cream
};

// Cream at the two opacities the footer needs, pre-flattened over pine so
// Outlook (which ignores `opacity`) renders the same hierarchy as the rest.
const FOOTER_SOFT = "#D4D8CC";
const FOOTER_FAINT = "#B0BCB0";
const FOOTER_RULE = "#3D6557";

// Brand faces first (Clash Display headlines, Archivo body). Clients that
// honour @font-face (Apple Mail, iOS Mail, some Outlook builds) load them from
// the site via fontFaces() below; Gmail and older Outlook fall back to the
// closest web-safe sans.
export const FONT_DISPLAY = "'Clash Display', 'Archivo', 'Helvetica Neue', Helvetica, Arial, sans-serif";
export const FONT_BODY = "'Archivo', 'Helvetica Neue', Helvetica, Arial, sans-serif";

// Absolute-URL @font-face rules for the brand fonts (progressive enhancement).
const fontFaces = () => {
    const base = `${siteUrl()}/assets/font`;
    return [
        `@font-face { font-family:'Clash Display'; font-weight:600; font-style:normal; font-display:swap; src:url('${base}/ClashDisplay-Semibold.woff2') format('woff2'); }`,
        `@font-face { font-family:'Archivo'; font-weight:100 900; font-style:normal; font-display:swap; src:url('${base}/Archivo-Variable-Latin.woff2') format('woff2'); }`,
    ].join("\n    ");
};

export const BRAND_NAME = "Energyflow";
export const BRAND_TAGLINE = "Fuel Your Health, Energize Your Life.";

// Type scale — one place to change sizing for every template.
export const TYPE = {
    h1: { size: "34px", line: "40px" },
    lead: { size: "15px", line: "24px" },
    bodyText: { size: "14px", line: "22px" },
    small: { size: "13px", line: "21px" },
    tiny: { size: "12px", line: "19px" },
    label: "10px",
    eyebrow: "11px",
};

// `mso-line-height-rule:exactly` stops the Word engine inflating line-height.
const LH = "mso-line-height-rule:exactly;";

/**
 * Resolve the public site origin for absolute links inside emails.
 * Emails are opened off-site, so every link MUST be absolute — a missing
 * env var would otherwise produce dead "/contact" links. Falls back to the
 * production domain so links never break even if the var is unset.
 */
export const siteUrl = () => {
    const raw = process.env.NEXT_PUBLIC_BASE_URL || "https://www.energyflow.in";
    return String(raw).replace(/\/+$/, ""); // strip trailing slash
};

export const contactUrl = () => `${siteUrl()}/contact`;
export const shopUrl = () => `${siteUrl()}/shop`;

// Current Energyflow logo (the green mark used across the site / auth pages).
// Served from /public so it resolves to an absolute, publicly-reachable URL
// once deployed — email clients can't load a bundled Next asset any other way.
// Deliberately the 32 KB `logo.png` rather than the 600 KB colour variants:
// Gmail clips a message once its total weight passes ~102 KB.
export const LOGO_URL = `${siteUrl()}/assets/images/hero/logo.png`;

/**
 * Escape user-supplied text before interpolating it into email HTML.
 * Customer names, product names, addresses and free-text contact messages
 * all flow into these templates; without escaping, a name like
 * `<b>` or an order note containing markup would corrupt the layout or
 * inject content. Always wrap dynamic strings with this.
 */
export const esc = (value) => {
    if (value === undefined || value === null) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};

/**
 * Escape a URL for an href. Same entity-escaping as esc(), but anything that
 * isn't an http(s)/mailto/tel/site-relative URL collapses to "#" so a hostile
 * or malformed value can never become a `javascript:` link.
 */
export const escUrl = (value) => {
    const raw = String(value ?? "").trim();
    if (!raw) return "#";
    if (!/^(https?:|mailto:|tel:|#|\/)/i.test(raw)) return "#";
    return esc(raw);
};

/**
 * First name only, for a warmer greeting. Returns RAW text (not escaped) — it
 * is always interpolated through an escaping helper (heading/paragraph), so
 * escaping here too would double-encode names containing special characters.
 * Safe on empty/undefined.
 */
export const firstName = (name) => {
    const trimmed = String(name || "").trim();
    if (!trimmed) return "there";
    return trimmed.split(/\s+/)[0];
};

/** ₹ formatting with Indian digit grouping. */
export const formatINR = (value) => {
    const n = Number(value || 0);
    return `₹${n.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
};

/** Plain integer with Indian digit grouping. Never renders "NaN". */
export const formatCount = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString("en-IN") : "—";
};

/** Short date, IST, e.g. "5 Oct 2026". Passes an unparseable value through. */
export const formatDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

/** Date + time, IST, for internal (admin) mail. */
export const formatDateTime = (value) => {
    const d = new Date(value || Date.now());
    if (Number.isNaN(d.getTime())) return String(value ?? "");
    return d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

/* ================================================================
   SHELL
   ================================================================ */

/**
 * Wrap content in the brand chrome: hidden preheader, cream logo header,
 * white content card on a cream ground, and a pine footer.
 *
 * @param {object} opts
 * @param {string} opts.preheader  Inbox preview text (kept out of the visible body).
 * @param {string} opts.bodyHtml   The unique per-email content (already escaped).
 * @param {string} [opts.title]    <title> for the document.
 */
export const emailShell = ({ preheader = "", bodyHtml = "", title = BRAND_NAME }) => `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${esc(title)}</title>
  <!--[if mso]>
  <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  <style>body,table,td,a,h1,p{font-family:Arial,Helvetica,sans-serif !important;}</style>
  <![endif]-->
  <style>
    ${fontFaces()}
    body { margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; background-color:${BRAND.cream}; }
    img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    table { border-collapse:collapse !important; }
    a { color:${BRAND.forest}; }
    /* Keep the cream card cream in clients that force a dark theme. */
    :root { color-scheme:light only; supported-color-schemes:light only; }
    .ms-card { width:600px; }
    @media only screen and (max-width:620px) {
      .ms-card { width:100% !important; }
      .ms-pad { padding-left:24px !important; padding-right:24px !important; }
      .ms-h1 { font-size:28px !important; line-height:34px !important; }
      .ms-stack { display:block !important; width:100% !important; padding-right:0 !important; }
      .ms-stack-right { text-align:left !important; padding-top:6px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.cream};">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${BRAND.cream};opacity:0;">
    ${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:${BRAND.cream};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="ms-card" width="600" style="width:600px;max-width:600px;background-color:${BRAND.white};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td align="center" style="background-color:${BRAND.cream};padding:30px 40px;">
              <a href="${siteUrl()}" target="_blank" style="text-decoration:none;">
                <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="120" style="display:block;width:120px;max-width:45%;height:auto;" />
              </a>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="ms-pad" style="padding:40px;font-family:${FONT_BODY};">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:${BRAND.pine};padding:30px 40px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:${FONT_DISPLAY};font-size:20px;line-height:26px;${LH}letter-spacing:0.5px;text-transform:uppercase;color:${BRAND.cream};padding-bottom:14px;">
                    ${BRAND_NAME}
                  </td>
                </tr>
                <tr>
                  <td style="font-family:${FONT_BODY};font-size:13px;line-height:21px;${LH}color:${FOOTER_SOFT};padding-bottom:16px;">
                    ${BRAND_TAGLINE}
                  </td>
                </tr>
                <tr>
                  <td style="font-family:${FONT_BODY};font-size:12px;line-height:20px;${LH}padding-bottom:14px;">
                    <a href="${shopUrl()}" target="_blank" style="color:${BRAND.cream};text-decoration:underline;">Shop</a>
                    &nbsp;&nbsp;·&nbsp;&nbsp;
                    <a href="${contactUrl()}" target="_blank" style="color:${BRAND.cream};text-decoration:underline;">Contact us</a>
                    &nbsp;&nbsp;·&nbsp;&nbsp;
                    <a href="${INSTAGRAM_URL}" target="_blank" style="color:${BRAND.cream};text-decoration:underline;">Instagram</a>
                    &nbsp;&nbsp;·&nbsp;&nbsp;
                    <a href="${FACEBOOK_URL}" target="_blank" style="color:${BRAND.cream};text-decoration:underline;">Facebook</a>
                    &nbsp;&nbsp;·&nbsp;&nbsp;
                    <a href="${X_URL}" target="_blank" style="color:${BRAND.cream};text-decoration:underline;">X</a>
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid ${FOOTER_RULE};padding-top:14px;font-family:${FONT_BODY};font-size:11px;line-height:18px;${LH}color:${FOOTER_FAINT};">
                    © ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/* ================================================================
   CONTENT PRIMITIVES
   Every template builds its body from these, so the type scale,
   spacing rhythm and colour roles stay identical across the suite.
   ================================================================ */

/** Uppercase tracked eyebrow label above a heading. */
export const eyebrow = (text) => `
<p style="margin:0 0 14px;font-family:${FONT_BODY};font-size:${TYPE.eyebrow};line-height:16px;${LH}font-weight:bold;letter-spacing:1.2px;text-transform:uppercase;color:${BRAND.forest};">${esc(text)}</p>`;

/** Display heading (Clash Display). */
export const heading = (text) => `
<h1 class="ms-h1" style="margin:0 0 18px;font-family:${FONT_DISPLAY};font-size:${TYPE.h1.size};line-height:${TYPE.h1.line};${LH}font-weight:600;letter-spacing:-0.5px;color:${BRAND.pine};">${esc(text)}</h1>`;

/** Body paragraph. `raw` lets a caller pass pre-built (already-escaped) HTML. */
export const paragraph = (text, { raw = false } = {}) => `
<p style="margin:0 0 18px;font-family:${FONT_BODY};font-size:${TYPE.lead.size};line-height:${TYPE.lead.line};${LH}color:${BRAND.body};">${raw ? text : esc(text)}</p>`;

/** Small uppercase field label (admin tables, detail stacks). */
export const label = (text) => `
<p style="margin:0 0 4px;font-family:${FONT_BODY};font-size:${TYPE.label};line-height:14px;${LH}font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${BRAND.muted};">${esc(text)}</p>`;

/**
 * Field value beneath a label(). Always receives pre-escaped HTML so callers
 * can embed links; `wrap` preserves newlines in free-text messages.
 */
export const fieldValue = (html, { wrap = false } = {}) => `
<p style="margin:0;font-family:${FONT_BODY};font-size:${TYPE.lead.size};line-height:${TYPE.lead.line};${LH}color:${BRAND.ink};${wrap ? "white-space:pre-wrap;" : ""}">${html}</p>`;

/**
 * Vertical label/value stack — the shape used by every notification and
 * confirmation email. `rows` is [[label, preEscapedHtml, opts?]]; falsy rows
 * and rows with an empty value are dropped, so a partial payload collapses
 * cleanly instead of printing blank fields.
 *
 * @param {Array} rows
 * @param {object} [opts]
 * @param {number} [opts.gap]  Bottom padding between rows, px.
 */
export const detailRows = (rows = [], { gap = 16 } = {}) => {
    const body = rows
        .filter((r) => Array.isArray(r) && r[0] && (r[1] ?? "") !== "")
        .map(
            ([text, html, o = {}]) => `
<tr>
  <td style="padding:0 0 ${gap}px;">
    ${label(text)}
    ${fieldValue(html, o)}
  </td>
</tr>`
        )
        .join("");

    return body
        ? `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">${body}
</table>`
        : "";
};

/** Cream inset panel — the standard container for a note or a callout. */
export const panel = (
    innerHtml,
    { bg = BRAND.cream, border = BRAND.border, pad = "18px 20px", align = "left", margin = "8px 0 24px" } = {}
) => `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:${margin};">
  <tr>
    <td align="${align}" style="background-color:${bg};border:1px solid ${border};border-radius:12px;padding:${pad};">
      ${innerHtml}
    </td>
  </tr>
</table>`;

/** Sunflower highlight band — used for the figures admins scan first. */
export const highlightBand = (innerHtml, { pad = "16px 20px", margin = "4px 0 24px" } = {}) => `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:${margin};">
  <tr>
    <td style="background-color:${BRAND.sun};border-radius:12px;padding:${pad};">
      ${innerHtml}
    </td>
  </tr>
</table>`;

/** Red alert panel. Reserved for genuine warnings (payment, security). */
export const alertPanel = (innerHtml) => `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
  <tr>
    <td style="background-color:${BRAND.dangerSoft};border:1px solid ${BRAND.danger};border-radius:12px;padding:14px 16px;font-family:${FONT_BODY};font-size:${TYPE.small.size};line-height:${TYPE.small.line};${LH}color:${BRAND.danger};">
      ${innerHtml}
    </td>
  </tr>
</table>`;

/**
 * Centred card showing one prominent value — the OTP code and the
 * ticket/reference numbers all use it, so they read as one family.
 *
 * @param {object} opts
 * @param {string} opts.caption    Uppercase label above the value.
 * @param {string} opts.value      The value (escaped here).
 * @param {string} [opts.size]     Display size of the value.
 * @param {string} [opts.tracking] Letter-spacing on the value.
 */
export const valueCard = ({ caption, value, size = "40px", tracking = "10px" }) =>
    panel(
        `
      ${caption
            ? `<p style="margin:0 0 8px;font-family:${FONT_BODY};font-size:${TYPE.eyebrow};line-height:16px;${LH}font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${BRAND.muted};">${esc(caption)}</p>`
            : ""}
      <p style="margin:0;font-family:${FONT_DISPLAY};font-size:${size};line-height:${size};${LH}font-weight:600;letter-spacing:${tracking};color:${BRAND.pine};">${esc(value)}</p>`,
        { align: "center", pad: "22px 24px" }
    );

/** Hairline rule with a small muted note under it (expiry, fine print). */
export const noteBlock = (html) => `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:8px;">
  <tr>
    <td style="border-top:1px solid ${BRAND.border};padding-top:20px;font-family:${FONT_BODY};font-size:${TYPE.small.size};line-height:${TYPE.small.line};${LH}color:${BRAND.muted};">
      ${html}
    </td>
  </tr>
</table>`;

/** Centred fine print, no rule. */
export const fineprint = (html) => `
<p style="margin:12px 0 0;text-align:center;font-family:${FONT_BODY};font-size:${TYPE.tiny.size};line-height:${TYPE.tiny.line};${LH}color:${BRAND.muted};">${html}</p>`;

/** Inline link, brand forest. `text` is escaped, `url` sanitised. */
export const link = (text, url, color = BRAND.forest) =>
    `<a href="${escUrl(url)}" target="_blank" style="color:${color};text-decoration:underline;">${esc(text)}</a>`;

/** mailto: link for admin mail. */
export const mailLink = (email) =>
    email ? `<a href="mailto:${esc(email)}" style="color:${BRAND.forest};">${esc(email)}</a>` : "";

/** tel: link for admin mail. Strips formatting from the dial string only. */
export const telLink = (phone) => {
    const digits = String(phone ?? "").replace(/[^\d+]/g, "");
    return phone ? `<a href="tel:${esc(digits)}" style="color:${BRAND.forest};">${esc(phone)}</a>` : "";
};

/**
 * Primary call-to-action button. Uses the bulletproof VML + anchor pattern so
 * it renders as a filled pill in Outlook's Word engine as well as everywhere
 * else, and derives its text colour from the fill (pine ink on sunflower,
 * cream on the dark greens) so contrast can never break.
 */
export const button = (labelText, url, bg = BRAND.pine) => {
    const href = escUrl(url);
    const fg = bg === BRAND.sun ? BRAND.sunInk : BRAND.cream;
    return `
<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
  <tr>
    <td align="center" bgcolor="${bg}" style="border-radius:999px;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:46px;v-text-anchor:middle;width:270px;" arcsize="50%" stroke="f" fillcolor="${bg}">
        <w:anchorlock/>
        <center style="color:${fg};font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;">${esc(String(labelText ?? "").toUpperCase())}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!---->
      <a href="${href}" target="_blank"
        style="display:inline-block;padding:14px 38px;font-family:${FONT_BODY};font-size:13px;line-height:18px;${LH}font-weight:bold;letter-spacing:0.6px;text-transform:uppercase;color:${fg};text-decoration:none;border-radius:999px;background-color:${bg};">
        ${esc(labelText)}
      </a>
      <!--<![endif]-->
    </td>
  </tr>
</table>`;
};

/** Centred CTA row with the standard vertical rhythm around it. */
export const ctaRow = (labelText, url, { bg = BRAND.pine, top = 28, bottom = 8, align = "center" } = {}) => `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:${top}px 0 ${bottom}px;">
  <tr><td align="${align}">${button(labelText, url, bg)}</td></tr>
</table>`;

/** CTA separated from the content above it by a hairline (admin mail). */
export const ctaRowRuled = (labelText, url, { bg = BRAND.pine } = {}) => `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:8px 0 0;">
  <tr>
    <td style="border-top:1px solid ${BRAND.border};padding-top:24px;">
      ${button(labelText, url, bg)}
    </td>
  </tr>
</table>`;

/** Order-id strip: muted caption left, display-font id right. */
export const idRow = (caption, value) => `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:4px 0 8px;">
  <tr>
    <td style="font-family:${FONT_BODY};font-size:${TYPE.small.size};line-height:${TYPE.small.line};${LH}color:${BRAND.muted};">${esc(caption)}</td>
    <td align="right" style="font-family:${FONT_DISPLAY};font-size:16px;line-height:22px;${LH}font-weight:600;color:${BRAND.pine};">${esc(value)}</td>
  </tr>
</table>`;

/**
 * Customer-facing progress timeline (Confirmed → Shipped → Delivered).
 * Steps at or before `activeIndex` get a forest dot and a pine label.
 */
export const timeline = (steps = [], activeIndex = 0) => {
    if (!steps.length) return "";
    const width = `${Math.floor(100 / steps.length)}%`;
    const cells = steps
        .map((text, i) => {
            const active = i <= activeIndex;
            return `<td align="center" width="${width}" style="font-family:${FONT_BODY};font-size:${TYPE.eyebrow};line-height:16px;${LH}font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${active ? BRAND.pine : BRAND.muted};padding-top:8px;">
      <div style="width:12px;height:12px;border-radius:50%;background-color:${active ? BRAND.forest : BRAND.border};margin:0 auto 8px;">&nbsp;</div>
      ${esc(text)}
    </td>`;
        })
        .join("");
    return `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
  <tr>${cells}</tr>
</table>`;
};

/** One line-item row. `qty` is shown muted beside the name. */
export const lineItemRow = (name, qty, amount, { pad = 14 } = {}) => `
<tr>
  <td style="padding:${pad}px 0;border-bottom:1px solid ${BRAND.border};font-family:${FONT_BODY};font-size:${TYPE.bodyText.size};line-height:20px;${LH}color:${BRAND.ink};">
    ${esc(name) || "Item"}<span style="color:${BRAND.muted};">&nbsp;×&nbsp;${esc(qty)}</span>
  </td>
  <td align="right" style="padding:${pad}px 0;border-bottom:1px solid ${BRAND.border};font-family:${FONT_BODY};font-size:${TYPE.bodyText.size};line-height:20px;${LH}color:${BRAND.ink};white-space:nowrap;">
    ${esc(amount)}
  </td>
</tr>`;

/**
 * Render an items array to rows. Shared so the customer receipt and the admin
 * alert can never disagree about the per-line amount.
 */
export const itemRows = (items = [], { pad = 14 } = {}) =>
    (Array.isArray(items) ? items : [])
        .map((it) =>
            lineItemRow(
                it?.name,
                it?.qty ?? 1,
                formatINR((Number(it?.sellingPrice) || 0) * (Number(it?.qty) || 1)),
                { pad }
            )
        )
        .join("");

/** Totals row. `strong` renders the grand total in pine bold. */
export const totalRow = (labelHtml, amountHtml, { strong = false, color } = {}) => {
    const size = strong ? "16px" : TYPE.bodyText.size;
    const weight = strong ? "font-weight:bold;" : "";
    return `
<tr>
  <td style="padding:6px 0;font-family:${FONT_BODY};font-size:${size};line-height:22px;${LH}color:${strong ? BRAND.pine : BRAND.body};${weight}">${labelHtml}</td>
  <td align="right" style="padding:6px 0;font-family:${FONT_BODY};font-size:${size};line-height:22px;${LH}color:${color || (strong ? BRAND.pine : BRAND.ink)};${weight}white-space:nowrap;">${amountHtml}</td>
</tr>`;
};

/**
 * Money breakdown: subtotal → discount → delivery → rule → total. Shared by
 * the customer receipt and the admin alert so the two always show the same
 * figures in the same order.
 */
export const totalsTable = ({
    subtotal = 0,
    couponDiscountAmount = 0,
    couponCode,
    deliveryCharge = 0,
    totalAmount = 0,
    topRule = true,
} = {}) => `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:6px 0 0;${topRule ? `border-top:1px solid ${BRAND.border};` : ""}">
  ${topRule ? `<tr><td colspan="2" style="font-size:0;line-height:0;padding-top:8px;">&nbsp;</td></tr>` : ""}
  ${totalRow("Subtotal", esc(formatINR(subtotal)))}
  ${Number(couponDiscountAmount) > 0
        ? totalRow(
            `Discount${couponCode ? ` (${esc(couponCode)})` : ""}`,
            `– ${esc(formatINR(couponDiscountAmount))}`,
            { color: BRAND.success }
        )
        : ""}
  ${Number(deliveryCharge) > 0 ? totalRow("Delivery", esc(formatINR(deliveryCharge))) : ""}
  <tr><td colspan="2" style="border-top:1px solid ${BRAND.border};font-size:0;line-height:0;padding-top:6px;">&nbsp;</td></tr>
  ${totalRow("Total", esc(formatINR(totalAmount)), { strong: true })}
</table>`;

/** Build an address block as pre-escaped HTML lines. Empty parts collapse. */
export const addressHtml = (address = {}, { landmarkPrefix = "" } = {}) =>
    [
        esc(address?.address),
        address?.landmark ? `${landmarkPrefix}${esc(address.landmark)}` : "",
        [esc(address?.city), esc(address?.state), esc(address?.pincode)].filter(Boolean).join(", "),
        esc(address?.country),
    ]
        .filter(Boolean)
        .join("<br />");
