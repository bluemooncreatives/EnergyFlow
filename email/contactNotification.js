import {
    emailShell,
    eyebrow,
    heading,
    detailRows,
    ctaRowRuled,
    mailLink,
    esc,
} from "./_shared";

/**
 * Internal notification sent to the store inbox when the public contact form is
 * submitted. Every field is user-supplied, so all of it is escaped to prevent
 * the layout being broken (or markup injected) by hostile input. The Reply CTA
 * deep-links to the visitor's email; the route also sets Reply-To so a plain
 * "Reply" works.
 */
export const contactNotification = ({ ticketId, name, email, phone, address, subject, message }) => {
    const bodyHtml = `
${eyebrow("Contact Form")}
${heading("New message received")}
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:8px;">
  <tr><td>
    ${detailRows([
        ["Reference", esc(ticketId)],
        ["From", `${esc(name)} &nbsp;·&nbsp; ${mailLink(email)}`],
        ["Mobile", esc(phone) || "—"],
        ["Address", esc(address) || "(Not provided)", { wrap: true }],
        ["Subject", esc(subject) || "(No subject)"],
        ["Message", esc(message) || "(No message)", { wrap: true }],
    ], { gap: 18 })}
  </td></tr>
</table>
${ctaRowRuled(`Reply to ${name}`, `mailto:${email}`)}`;

    return emailShell({
        preheader: `New contact message from ${name}.`,
        title: "New contact message",
        bodyHtml,
    });
};
