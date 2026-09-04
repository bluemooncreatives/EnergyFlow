import {
    emailShell,
    eyebrow,
    heading,
    paragraph,
    button,
    firstName,
    siteUrl,
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
${paragraph("Your email is verified and your Energyflow account is ready. Thank you for joining us — we can't wait for you to discover pieces stitched with care.")}
${paragraph("Explore the latest arrivals and find something you'll love.")}
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:8px 0;">
  <tr><td align="center">${button("Start shopping", `${siteUrl()}/shop`)}</td></tr>
</table>`;

    return emailShell({
        preheader: "Your Energyflow account is verified and ready.",
        title: "Welcome to Energyflow",
        bodyHtml,
    });
};
