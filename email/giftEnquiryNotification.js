import {
    BRAND,
    FONT_BODY,
    emailShell,
    eyebrow,
    heading,
    button,
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
    const row = (label, value) => `
<tr>
  <td style="padding:0 0 16px;">
    <p style="margin:0 0 4px;font-family:${FONT_BODY};font-size:10px;font-weight:bold;letter-spacing:0;text-transform:uppercase;color:${BRAND.muted};">${esc(label)}</p>
    <p style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:22px;color:${BRAND.ink};white-space:pre-wrap;">${value}</p>
  </td>
</tr>`;

    const headline = `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:4px 0 24px;">
  <tr>
    <td style="background-color:${BRAND.sun};border-radius:12px;padding:18px 22px;">
      <p style="margin:0 0 4px;font-family:${FONT_BODY};font-size:11px;font-weight:bold;text-transform:uppercase;color:${BRAND.oxblood};">Requested quantity</p>
      <p style="margin:0;font-family:${FONT_BODY};font-size:26px;font-weight:bold;color:${BRAND.oxblood};">${esc(Number(quantity).toLocaleString("en-IN"))} boxes</p>
    </td>
  </tr>
</table>`;

    const productList = products.length
        ? products.map((p) => `• ${esc(p.name)}`).join("<br />")
        : "(No specific box chosen)";

    const bodyHtml = `
${eyebrow("Corporate gifting")}
${heading("New gifting enquiry")}
${headline}
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
  ${row("Reference", esc(ticketId))}
  ${row("Contact", `${esc(name)}${company ? ` &nbsp;·&nbsp; ${esc(company)}` : ""}`)}
  ${row("Email", `<a href="mailto:${esc(email)}" style="color:${BRAND.crimson};">${esc(email)}</a>`)}
  ${row("Phone", `<a href="tel:${esc(String(phone).replace(/[^\d+]/g, ""))}" style="color:${BRAND.crimson};">${esc(phone)}</a>`)}
  ${city ? row("City", esc(city)) : ""}
  ${row("Occasion", esc(occasion))}
  ${row("Budget per box", esc(budget) || "(Not specified)")}
  ${row("Needed by", esc(deliveryDate) || "(Flexible)")}
  ${row("Custom branding", branding ? "Yes — logo / personalised packaging" : "No")}
  ${row("Boxes of interest", productList)}
  ${row("Message", esc(message) || "(No message)")}
</table>
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:8px;">
  <tr>
    <td style="border-top:1px solid ${BRAND.border};padding-top:24px;">
      ${button("Open in admin", esc(`${siteUrl()}/admin/gift-enquiries/details/${id}`))}
    </td>
  </tr>
</table>`;

    return emailShell({
        preheader: `${name}${company ? ` (${company})` : ""} wants ${quantity} gift boxes.`,
        title: "New gifting enquiry",
        bodyHtml,
    });
};
