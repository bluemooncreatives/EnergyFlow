import {
    BRAND,
    FONT_BODY,
    emailShell,
    eyebrow,
    heading,
    paragraph,
    button,
    firstName,
    esc,
} from "./_shared";

/**
 * Email-address confirmation link sent at registration (and re-sent on a
 * login attempt by an unverified account).
 *
 * @param {string} link            Absolute verification URL.
 * @param {object} [opts]
 * @param {string} [opts.name]     Recipient name for a personal greeting.
 */
export const emailVerificationLink = (link, opts = {}) => {
    const { name } = opts;

    const bodyHtml = `
${eyebrow("Confirm your email")}
${heading("You're almost there")}
${paragraph(`Hi ${firstName(name)},`)}
${paragraph("Welcome to Energyflow! Please confirm your email address to activate your account and start shopping.")}
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;">
  <tr><td align="center">${button("Verify my email", esc(link))}</td></tr>
</table>
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
    <td style="border-top:1px solid ${BRAND.border};padding-top:20px;font-family:${FONT_BODY};font-size:13px;line-height:21px;color:${BRAND.muted};">
      If the button doesn't work, copy and paste this link into your browser:<br />
      <a href="${esc(link)}" target="_blank" style="color:${BRAND.crimson};word-break:break-all;">${esc(link)}</a>
      <br /><br />
      This link expires in <strong style="color:${BRAND.ink};">1 hour</strong>. If you didn't create a Energyflow account, you can safely ignore this email.
    </td>
  </tr>
</table>`;

    return emailShell({
        preheader: "Confirm your email to activate your Energyflow account.",
        title: "Verify your email",
        bodyHtml,
    });
};
