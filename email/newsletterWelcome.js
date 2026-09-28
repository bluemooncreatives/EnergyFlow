import {
    BRAND,
    FONT_BODY,
    FONT_DISPLAY,
    emailShell,
    eyebrow,
    heading,
    paragraph,
    button,
    esc,
    firstName,
    formatINR,
    siteUrl,
} from "./_shared";

/**
 * Sent once when someone joins the newsletter (popup, homepage band or footer).
 * When the popup offer is live it carries the welcome coupon as a sunflower
 * "ticket", and every send ends with the one-click unsubscribe link.
 *
 * @param {object} opts
 * @param {string} [opts.name]
 * @param {object} [opts.coupon]   { code, discountPercentage, minShoppingAmount, validity }
 * @param {string} opts.unsubscribeUrl
 */
export const newsletterWelcome = ({ name, coupon, unsubscribeUrl }) => {
    const couponBlock = coupon
        ? `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:8px 0 26px;">
  <tr>
    <td align="center" style="background-color:${BRAND.sun};border:2px dashed ${BRAND.oxblood};border-radius:14px;padding:22px 20px;">
      <p style="margin:0 0 6px;font-family:${FONT_BODY};font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${BRAND.oxblood};">Your welcome code</p>
      <p style="margin:0 0 8px;font-family:${FONT_DISPLAY};font-size:32px;line-height:36px;font-weight:600;letter-spacing:3px;color:${BRAND.oxblood};">${esc(coupon.code)}</p>
      <p style="margin:0;font-family:${FONT_BODY};font-size:13px;line-height:20px;color:${BRAND.oxblood};">
        ${esc(coupon.discountPercentage)}% off${Number(coupon.minShoppingAmount) > 0 ? ` on orders above ${esc(formatINR(coupon.minShoppingAmount))}` : ""}
        ${coupon.validity ? ` &nbsp;·&nbsp; valid till ${esc(new Date(coupon.validity).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }))}` : ""}
      </p>
    </td>
  </tr>
</table>`
        : "";

    const bodyHtml = `
${eyebrow("Welcome to the club")}
${heading("Good things are headed your way")}
${paragraph(`Hi ${firstName(name)},`)}
${paragraph("Thanks for joining the Energyflow newsletter. You'll be the first to hear about fresh harvests, restocks of the favourites and members-only deals, plus the odd recipe worth keeping.")}
${couponBlock}
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
  <tr><td align="center">${button(coupon ? "Use my code" : "Start shopping", `${siteUrl()}/shop`)}</td></tr>
</table>
<p style="margin:0;font-family:${FONT_BODY};font-size:12px;line-height:19px;color:${BRAND.muted};text-align:center;">
  Not for you? <a href="${esc(unsubscribeUrl)}" target="_blank" style="color:${BRAND.muted};text-decoration:underline;">Unsubscribe</a> with one click.
</p>`;

    return emailShell({
        preheader: coupon
            ? `Your welcome code ${coupon.code} is inside.`
            : "You're on the list — fresh drops and member deals are on the way.",
        title: "Welcome to the Energyflow club",
        bodyHtml,
    });
};
