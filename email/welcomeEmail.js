import {
    emailShell,
    eyebrow,
    heading,
    paragraph,
    ctaRow,
    firstName,
    shopUrl,
} from "./_shared";

/**
 * Warm welcome sent once an account's email has been verified. Confirms the
 * account is active and points the new customer to the shop.
 *
 * @param {object} [opts]
 * @param {string} [opts.name]
 */
export const welcomeEmail = (opts = {}) => {
    const { name } = opts;

    const bodyHtml = `
${eyebrow("Welcome")}
${heading("You're all set!")}
${paragraph(`Hi ${firstName(name)},`)}
${paragraph("Your email is verified and your Energyflow account is ready. Thank you for joining us — we can't wait for you to taste the difference honest sourcing makes.")}
${paragraph("Explore our dry fruits, nuts, seeds, super foods and wellness range, and find your new everyday staples.")}
${ctaRow("Start shopping", shopUrl(), { top: 8, bottom: 8 })}`;

    return emailShell({
        preheader: "Your Energyflow account is verified and ready.",
        title: "Welcome to Energyflow",
        bodyHtml,
    });
};
