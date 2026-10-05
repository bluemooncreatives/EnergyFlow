import {
    BRAND,
    FONT_BODY,
    FONT_DISPLAY,
    TYPE,
    emailShell,
    eyebrow,
    heading,
    highlightBand,
    detailRows,
    ctaRowRuled,
    mailLink,
    telLink,
    formatCount,
    esc,
    siteUrl,
} from "./_shared";

/**
 * Internal alert to the store inbox when a corporate / bulk gifting enquiry
 * comes in from the gift-boxes page. Every field is user-supplied and
 * escaped. The primary CTA opens the enquiry in the admin panel; the route
 * also sets Reply-To so a plain "Reply" reaches the customer.
 *
 * Labels (occasion, budget) arrive already resolved to their display text.
 */
export const giftEnquiryNotification = ({
    id,
    ticketId,
    name,
    company,
    email,
    phone,
    city,
    occasion,
    quantity,
    budget,
    deliveryDate,
    branding,
    products = [],
    message,
}) => {
    const list = Array.isArray(products) ? products : [];

    const headline = highlightBand(`
      <p style="margin:0 0 4px;font-family:${FONT_BODY};font-size:${TYPE.eyebrow};line-height:16px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${BRAND.sunInk};">Requested quantity</p>
      <p style="margin:0;font-family:${FONT_DISPLAY};font-size:26px;line-height:32px;font-weight:600;color:${BRAND.sunInk};">${esc(formatCount(quantity))} boxes</p>`,
        { pad: "18px 22px" });

    const productList = list.length
        ? list.map((p) => `• ${esc(p?.name)}`).join("<br />")
        : "(No specific box chosen)";

    const bodyHtml = `
${eyebrow("Corporate gifting")}
${heading("New gifting enquiry")}
${headline}
${detailRows([
        ["Reference", esc(ticketId)],
        ["Contact", `${esc(name)}${company ? ` &nbsp;·&nbsp; ${esc(company)}` : ""}`],
        ["Email", mailLink(email)],
        ["Phone", telLink(phone)],
        ["City", esc(city)],
        ["Occasion", esc(occasion)],
        ["Budget per box", esc(budget) || "(Not specified)"],
        ["Needed by", esc(deliveryDate) || "(Flexible)"],
        ["Custom branding", branding ? "Yes - logo / personalised packaging" : "No"],
        ["Boxes of interest", productList],
        ["Message", esc(message) || "(No message)", { wrap: true }],
    ])}
${ctaRowRuled("Open in admin", `${siteUrl()}/admin/gift-enquiries/details/${encodeURIComponent(id || "")}`)}`;

    return emailShell({
        preheader: `${name}${company ? ` (${company})` : ""} wants ${formatCount(quantity)} gift boxes.`,
        title: "New gifting enquiry",
        bodyHtml,
    });
};
