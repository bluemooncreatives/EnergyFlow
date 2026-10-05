import {
    BRAND,
    emailShell,
    eyebrow,
    heading,
    paragraph,
    valueCard,
    detailRows,
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
    const bodyHtml = `
${eyebrow("Message received")}
${heading("Thanks for reaching out")}
${paragraph(`Hi ${firstName(name)},`)}
${paragraph("We've received your message and our team will get back to you as soon as possible. Please keep the reference number below for any follow-up — just reply to this email and we'll pick up right where you left off.")}
${valueCard({ caption: "Your reference number", value: ticketId, size: "26px", tracking: "2px" })}
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top:1px solid ${BRAND.border};margin-top:8px;">
  <tr><td style="padding-top:20px;">
    ${detailRows([
        ["Subject", esc(subject)],
        ["Your message", esc(message), { wrap: true }],
    ])}
  </td></tr>
</table>`;

    return emailShell({
        preheader: `We've received your message — reference ${ticketId}.`,
        title: "We've received your message",
        bodyHtml,
    });
};
