import {
    BRAND,
    FONT_BODY,
    emailShell,
    eyebrow,
    heading,
    button,
    esc,
    siteUrl,
} from "./_shared";

const SOURCE_LABEL = {
    popup: "Website popup",
    section: "Homepage newsletter band",
    footer: "Footer sign-up",
};

/**
 * Optional internal alert (Admin → Newsletter → Emails) sent to the store inbox
 * for each new subscriber. Every value is visitor-supplied, so all of it is
 * escaped.
 */
export const newsletterNotification = ({ email, name, source, pagePath }) => {
    const row = (label, value) => `
<tr>
  <td style="padding:0 0 18px;">
    <p style="margin:0 0 4px;font-family:${FONT_BODY};font-size:10px;font-weight:bold;letter-spacing:0;text-transform:uppercase;color:${BRAND.muted};">${esc(label)}</p>
    <p style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:22px;color:${BRAND.ink};">${value}</p>
  </td>
</tr>`;

    const bodyHtml = `
${eyebrow("Newsletter")}
${heading("New subscriber")}
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:8px;">
  ${row("Email", `<a href="mailto:${esc(email)}" style="color:${BRAND.crimson};">${esc(email)}</a>`)}
  ${name ? row("Name", esc(name)) : ""}
  ${row("Signed up via", esc(SOURCE_LABEL[source] || source))}
  ${pagePath ? row("Page", esc(pagePath)) : ""}
</table>
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:8px;">
  <tr>
    <td style="border-top:1px solid ${BRAND.border};padding-top:24px;">
      ${button("View subscribers", `${siteUrl()}/admin/newsletter`)}
    </td>
  </tr>
</table>`;

    return emailShell({
        preheader: `${email} just joined the newsletter.`,
        title: "New newsletter subscriber",
        bodyHtml,
    });
};
