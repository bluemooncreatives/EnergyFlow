import {
    emailShell,
    eyebrow,
    heading,
    detailRows,
    ctaRowRuled,
    mailLink,
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
    const bodyHtml = `
${eyebrow("Newsletter")}
${heading("New subscriber")}
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:8px;">
  <tr><td>
    ${detailRows([
        ["Email", mailLink(email)],
        ["Name", esc(name)],
        ["Signed up via", esc(SOURCE_LABEL[source] || source)],
        ["Page", esc(pagePath)],
    ], { gap: 18 })}
  </td></tr>
</table>
${ctaRowRuled("View subscribers", `${siteUrl()}/admin/newsletter`)}`;

    return emailShell({
        preheader: `${email} just joined the newsletter.`,
        title: "New newsletter subscriber",
        bodyHtml,
    });
};
