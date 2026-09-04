import {
    BRAND,
    FONT_BODY,
    emailShell,
    eyebrow,
    heading,
    button,
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
    const row = (label, value) => `
<tr>
  <td style="padding:0 0 18px;">
    <p style="margin:0 0 4px;font-family:${FONT_BODY};font-size:10px;font-weight:bold;letter-spacing:0;text-transform:uppercase;color:${BRAND.muted};">${esc(label)}</p>
    <p style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:22px;color:${BRAND.ink};white-space:pre-wrap;">${value}</p>
  </td>
</tr>`;

    const bodyHtml = `
${eyebrow("Contact Form")}
${heading("New message received")}
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:8px;">
  ${ticketId ? row("Reference", esc(ticketId)) : ""}
  ${row("From", `${esc(name)} &nbsp;·&nbsp; <a href="mailto:${esc(email)}" style="color:${BRAND.crimson};">${esc(email)}</a>`)}
  ${row("Mobile", esc(phone) || "—")}
  ${row("Address", esc(address) || "(Not provided)")}
  ${row("Subject", esc(subject) || "(No subject)")}
  ${row("Message", esc(message))}
</table>
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:8px;">
  <tr>
    <td style="border-top:1px solid ${BRAND.border};padding-top:24px;">
      ${button(`Reply to ${name}`, `mailto:${esc(email)}`)}
    </td>
  </tr>
</table>`;

    return emailShell({
        preheader: `New contact message from ${name}.`,
        title: "New contact message",
        bodyHtml,
    });
};
