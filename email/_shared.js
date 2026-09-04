/* ================================================================
   ENERGYFLOW — EMAIL DESIGN SYSTEM (shared)
   Single source of truth for every transactional email.
   Email clients strip <style> custom-properties and external fonts,
   so every value here is a literal inline-able constant and every
   layout primitive is table-based with inline styles.
   Brand tokens mirror the app auth theme (dark green primary on an
   ash-white ground) but are hard-coded because CSS vars don't survive
   in Gmail/Outlook/Apple Mail. Token KEYS are kept stable (oxblood /
   crimson / cream / warm) so every template keeps working unchanged —
   only the values moved from red to green/ash.
   ================================================================ */

// ── Brand palette (ash white + dark green) ──
export const BRAND = {
    oxblood: "#1E4229", // primary dark green — headings, footer, code, CTAs
    crimson: "#2F6B41", // accent green — links, eyebrow, active dots
    cream: "#E4E7DE", // pale ash — header band + light text on dark green footer
    warm: "#ECECE9", // ash white — page background + inset panels
    ink: "#1A1A1A", // near-black body copy
    body: "#4A4A4A", // --text-body
    white: "#FFFFFF",
    border: "#E2E3DE", // soft ash-grey hairline
    borderStrong: "#CCCDC6",
    muted: "#868B80", // ash-grey label
    success: "#2E7D32",
    danger: "#B3261E", // kept red — security warnings must still read as alerts
};

// Web-safe stacks that read closest to the brand faces
// (Felixti display ≈ editorial serif; PP Neue Montreal ≈ grotesque sans).
export const FONT_DISPLAY = "Georgia, 'Times New Roman', Times, serif";
export const FONT_BODY = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// The only real social account we own.
export const INSTAGRAM_URL =
    "https://www.instagram.com/mom.stitched";

export const BRAND_NAME = "Energyflow";

/**
 * Resolve the public site origin for absolute links inside emails.
 * Emails are opened off-site, so every link MUST be absolute — a missing
 * env var would otherwise produce dead "/contact" links. Falls back to the
 * production domain so links never break even if the var is unset.
 */
export const siteUrl = () => {
    const raw = process.env.NEXT_PUBLIC_BASE_URL || "https://www.energyflow.com";
    return String(raw).replace(/\/+$/, ""); // strip trailing slash
};

export const contactUrl = () => `${siteUrl()}/contact`;

// Current Energyflow logo (the green mark used across the site / auth pages).
// Served from /public so it resolves to an absolute, publicly-reachable URL
// once deployed — email clients can't load a bundled Next asset any other way.
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

/**
 * Primary call-to-action button. Uses the bulletproof VML+anchor pattern so
 * it renders as a filled pill in Outlook (Word engine) as well as everywhere
 * else. `bg` defaults to the brand oxblood.
 */
export const button = (label, url, bg = BRAND.oxblood) => `
<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
  <tr>
    <td align="center" bgcolor="${bg}" style="border-radius:999px;">
      <a href="${url}" target="_blank"
        style="display:inline-block;padding:14px 38px;font-family:${FONT_BODY};font-size:13px;font-weight:bold;letter-spacing:0;text-transform:uppercase;color:${BRAND.cream};text-decoration:none;border-radius:999px;background-color:${bg};">
        ${esc(label)}
      </a>
    </td>
  </tr>
</table>`;

/**
 * Wrap content in the brand chrome: hidden preheader, cream logo header,
 * white content card on a warm background, and an oxblood footer.
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
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${esc(title)}</title>
  <!--[if mso]><style>body,table,td,a{font-family:Arial,Helvetica,sans-serif !important;}</style><![endif]-->
  <style>
    body { margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; background-color:${BRAND.warm}; }
    img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    table { border-collapse:collapse !important; }
    a { color:${BRAND.crimson}; }
    .ms-card { width:600px; }
    @media only screen and (max-width:620px) {
      .ms-card { width:100% !important; }
      .ms-pad { padding-left:24px !important; padding-right:24px !important; }
      .ms-h1 { font-size:28px !important; line-height:34px !important; }
      .ms-stack { display:block !important; width:100% !important; }
      .ms-stack-right { text-align:left !important; padding-top:4px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.warm};">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${BRAND.warm};opacity:0;">
    ${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:${BRAND.warm};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="ms-card" width="600" style="width:600px;max-width:600px;background-color:${BRAND.white};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td align="center" style="background-color:${BRAND.cream};padding:30px 40px;">
              <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="120" style="display:block;width:120px;max-width:45%;height:auto;" />
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
            <td style="background-color:${BRAND.oxblood};padding:30px 40px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:${FONT_DISPLAY};font-size:20px;letter-spacing:0;text-transform:uppercase;color:${BRAND.cream};padding-bottom:14px;">
                    ${BRAND_NAME}
                  </td>
                </tr>
                <tr>
                  <td style="font-family:${FONT_BODY};font-size:13px;line-height:21px;color:${BRAND.cream};opacity:0.85;padding-bottom:16px;">
                    Handmade with care, stitched with love.
                  </td>
                </tr>
                <tr>
                  <td style="font-family:${FONT_BODY};font-size:12px;line-height:20px;padding-bottom:14px;">
                    <a href="${contactUrl()}" target="_blank" style="color:${BRAND.cream};text-decoration:underline;">Contact us</a>
                    &nbsp;&nbsp;·&nbsp;&nbsp;
                    <a href="${INSTAGRAM_URL}" target="_blank" style="color:${BRAND.cream};text-decoration:underline;">Instagram</a>
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid rgba(238,241,234,0.22);padding-top:14px;font-family:${FONT_BODY};font-size:11px;line-height:18px;color:${BRAND.cream};opacity:0.7;">
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

// ── Small content primitives used across templates ──

/** Uppercase tracked eyebrow label above a heading. */
export const eyebrow = (text) => `
<p style="margin:0 0 14px;font-family:${FONT_BODY};font-size:11px;font-weight:bold;letter-spacing:0;text-transform:uppercase;color:${BRAND.crimson};">${esc(text)}</p>`;

/** Editorial serif heading. */
export const heading = (text) => `
<h1 class="ms-h1" style="margin:0 0 18px;font-family:${FONT_DISPLAY};font-size:34px;line-height:40px;font-weight:normal;letter-spacing:-0.5px;color:${BRAND.oxblood};">${esc(text)}</h1>`;

/** Body paragraph. `raw` lets a caller pass pre-built (already-escaped) HTML. */
export const paragraph = (text, { raw = false } = {}) => `
<p style="margin:0 0 18px;font-family:${FONT_BODY};font-size:15px;line-height:24px;color:${BRAND.body};">${raw ? text : esc(text)}</p>`;
