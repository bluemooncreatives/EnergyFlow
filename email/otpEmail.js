import {
    BRAND,
    emailShell,
    eyebrow,
    heading,
    paragraph,
    valueCard,
    noteBlock,
    firstName,
} from "./_shared";

/**
 * One-time-password email. The same code card serves both login 2FA and the
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

    const bodyHtml = `
${eyebrow(eyebrowText)}
${heading(headingText)}
${paragraph(`Hi ${firstName(name)},`)}
${paragraph(lead)}
${valueCard({ caption: "Your verification code", value: otp })}
${noteBlock(
        `This code expires in <strong style="color:${BRAND.ink};">10 minutes</strong> and can be used once. If you didn't request this, you can safely ignore this email${isReset ? "" : " — your account is still secure"}.`
    )}`;

    return emailShell({
        preheader: `Your Energyflow code is ${otp} (valid for 10 minutes).`,
        title: headingText,
        bodyHtml,
    });
};
