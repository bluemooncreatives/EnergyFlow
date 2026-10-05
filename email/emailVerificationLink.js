import {
    BRAND,
    emailShell,
    eyebrow,
    heading,
    paragraph,
    ctaRow,
    noteBlock,
    link,
    firstName,
} from "./_shared";

/**
 * Email-address confirmation link sent at registration (and re-sent on a
 * login attempt by an unverified account).
 *
 * @param {string} verifyLink      Absolute verification URL.
 * @param {object} [opts]
 * @param {string} [opts.name]     Recipient name for a personal greeting.
 */
export const emailVerificationLink = (verifyLink, opts = {}) => {
    const { name } = opts;

    const bodyHtml = `
${eyebrow("Confirm your email")}
${heading("You're almost there")}
${paragraph(`Hi ${firstName(name)},`)}
${paragraph("Welcome to Energyflow! Please confirm your email address to activate your account and start shopping.")}
${ctaRow("Verify my email", verifyLink, { top: 8, bottom: 28 })}
${noteBlock(
        `If the button doesn't work, copy and paste this link into your browser:<br />
      <span style="word-break:break-all;">${link(verifyLink, verifyLink)}</span>
      <br /><br />
      This link expires in <strong style="color:${BRAND.ink};">1 hour</strong>. If you didn't create an Energyflow account, you can safely ignore this email.`
    )}`;

    return emailShell({
        preheader: "Confirm your email to activate your Energyflow account.",
        title: "Verify your email",
        bodyHtml,
    });
};
