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
 * One-time-password email. The same code block serves both login 2FA and the
 * password-reset flow — `purpose` only changes the copy so the recipient knows
 * which action they are confirming (previously this template always said
 * "Email Verification", which was wrong for a login code).
 *
 * @param {string} otp
 * @param {object} [opts]
 * @param {string} [opts.name]                Recipient name for a personal greeting.
 * @param {'login'|'reset'} [opts.purpose]    Which flow this code belongs to.
 */
export const otpEmail = (otp, opts = {}) => {
    const { name, purpose = "login" } = opts;
    const isReset = purpose === "reset";

    const eyebrowText = isReset ? "Password Reset" : "Secure Sign In";
    const headingText = isReset ? "Reset your password" : "Verify it's you";
    const lead = isReset
        ? "Use the one-time code below to reset your Energyflow password."
        : "Use the one-time code below to finish signing in to your Energyflow account.";

    const codeBlock = `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
  <tr>
    <td align="center" style="background-color:${BRAND.warm};border:1px solid ${BRAND.border};border-radius:12px;padding:24px;">
      <p style="margin:0 0 8px;font-family:${FONT_BODY};font-size:11px;font-weight:bold;letter-spacing:0;text-transform:uppercase;color:${BRAND.muted};">Your verification code</p>
      <p style="margin:0;font-family:${FONT_DISPLAY};font-size:40px;font-weight:bold;letter-spacing:10px;color:${BRAND.oxblood};">${esc(otp)}</p>
    </td>
  </tr>
</table>`;

    const noteBlock = `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:8px;">
  <tr>
    <td style="border-top:1px solid ${BRAND.border};padding-top:20px;font-family:${FONT_BODY};font-size:13px;line-height:21px;color:${BRAND.muted};">
      This code expires in <strong style="color:${BRAND.ink};">10 minutes</strong> and can be used once. If you didn't request this, you can safely ignore this email${isReset ? "" : " — your account is still secure"}.
    </td>
  </tr>
</table>`;

    const bodyHtml = `
${eyebrow(eyebrowText)}
${heading(headingText)}
${paragraph(`Hi ${firstName(name)},`)}
${paragraph(lead)}
${codeBlock}
${noteBlock}`;

    return emailShell({
        preheader: `Your Energyflow code is ${otp} (valid for 10 minutes).`,
        title: headingText,
        bodyHtml,
    });
};
