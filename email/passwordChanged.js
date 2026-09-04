import {
    BRAND,
    FONT_BODY,
    emailShell,
    eyebrow,
    heading,
    paragraph,
    button,
    firstName,
    contactUrl,
} from "./_shared";

/**
 * Security notice sent whenever an account's password is changed or set —
 * standard practice so the account owner is alerted if it wasn't them. Fired
 * from the profile change-password and the forgot-password reset flows.
 *
 * @param {object} [opts]
 * @param {string} [opts.name]
 * @param {'changed'|'set'|'reset'} [opts.action]   Tailors the copy.
 */
export const passwordChanged = (opts = {}) => {
    const { name, action = "changed" } = opts;

    const headingText =
        action === "set"
            ? "Your password is set"
            : action === "reset"
                ? "Your password was reset"
                : "Your password was changed";

    const lead =
        action === "set"
            ? "A password has been set on your Energyflow account. You can now sign in with your email and password."
            : action === "reset"
                ? "Your Energyflow password was just reset successfully. You can now sign in with your new password."
                : "Your Energyflow password was just changed successfully.";

    const bodyHtml = `
${eyebrow("Security")}
${heading(headingText)}
${paragraph(`Hi ${firstName(name)},`)}
${paragraph(lead)}
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
  <tr>
    <td style="background-color:${BRAND.warm};border:1px solid ${BRAND.border};border-radius:12px;padding:18px 20px;font-family:${FONT_BODY};font-size:14px;line-height:22px;color:${BRAND.body};">
      <strong style="color:${BRAND.oxblood};">Didn't do this?</strong> If you didn't make this change, your account may be at risk. Reset your password again immediately and <a href="${contactUrl()}" target="_blank" style="color:${BRAND.crimson};">contact our team</a>.
    </td>
  </tr>
</table>
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
  <tr><td align="center">${button("Go to Energyflow", contactUrl().replace(/\/contact$/, ""))}</td></tr>
</table>`;

    return emailShell({
        preheader: "Your Energyflow account password was just updated.",
        title: headingText,
        bodyHtml,
    });
};
