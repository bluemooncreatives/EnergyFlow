import {
    BRAND,
    FONT_BODY,
    TYPE,
    emailShell,
    eyebrow,
    heading,
    paragraph,
    panel,
    ctaRow,
    link,
    firstName,
    contactUrl,
    siteUrl,
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

    const warning = panel(
        `<p style="margin:0;font-family:${FONT_BODY};font-size:${TYPE.bodyText.size};line-height:${TYPE.bodyText.line};color:${BRAND.body};">
        <strong style="color:${BRAND.pine};">Didn't do this?</strong> If you didn't make this change, your account may be at risk. Reset your password again immediately and ${link("contact our team", contactUrl())}.
      </p>`
    );

    const bodyHtml = `
${eyebrow("Security")}
${heading(headingText)}
${paragraph(`Hi ${firstName(name)},`)}
${paragraph(lead)}
${warning}
${ctaRow("Go to Energyflow", siteUrl(), { top: 0, bottom: 8 })}`;

    return emailShell({
        preheader: "Your Energyflow account password was just updated.",
        title: headingText,
        bodyHtml,
    });
};
