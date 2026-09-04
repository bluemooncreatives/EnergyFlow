import {
    BRAND,
    FONT_BODY,
    FONT_DISPLAY,
    emailShell,
    eyebrow,
    heading,
    paragraph,
    firstName,
    esc,
} from "./_shared";

/**
 * Auto-acknowledgement sent to the visitor who submitted the contact form.
 * Confirms we received the message and gives them a reference number to quote
 * in any follow-up. Every interpolated field is user-supplied, so all of it is
 * escaped. This is a best-effort send — the query is already persisted, so a
 * mail failure must never block the submission.
 *
 * @param {object} data
 * @param {string} data.ticketId   Human-readable reference (e.g. MS-A7K3Q2XY)
 * @param {string} data.name
 * @param {string} [data.subject]
 * @param {string} data.message
 */
export const contactConfirmation = ({ ticketId, name, subject, message }) => {
    const refCard = `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
  <tr>
    <td align="center" style="background-color:${BRAND.warm};border:1px solid ${BRAND.border};border-radius:12px;padding:20px 24px;">
      <p style="margin:0 0 6px;font-family:${FONT_BODY};font-size:11px;font-weight:bold;letter-spacing:0;text-transform:uppercase;color:${BRAND.muted};">Your reference number</p>
      <p style="margin:0;font-family:${FONT_DISPLAY};font-size:26px;letter-spacing:1px;color:${BRAND.oxblood};">${esc(ticketId)}</p>
    </td>
  </tr>
</table>`;

    const detail = (label, value) => `
<tr>
  <td style="padding:0 0 16px;">
    <p style="margin:0 0 4px;font-family:${FONT_BODY};font-size:10px;font-weight:bold;letter-spacing:0;text-transform:uppercase;color:${BRAND.muted};">${esc(label)}</p>
    <p style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:22px;color:${BRAND.ink};white-space:pre-wrap;">${esc(value)}</p>
  </td>
</tr>`;

    const bodyHtml = `
${eyebrow("Message received")}
${heading("Thanks for reaching out")}
${paragraph(`Hi ${firstName(name)},`)}
${paragraph("We've received your message and our team will get back to you as soon as possible. Please keep the reference number below for any follow-up — just reply to this email and we'll pick up right where you left off.")}
${refCard}
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top:1px solid ${BRAND.border};padding-top:8px;margin-top:8px;">
  ${subject ? detail("Subject", subject) : ""}
  ${detail("Your message", message)}
</table>`;

    return emailShell({
        preheader: `We've received your message — reference ${ticketId}.`,
        title: "We've received your message",
        bodyHtml,
    });
};
