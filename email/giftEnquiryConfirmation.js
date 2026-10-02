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
 * Acknowledgement sent to the customer after a corporate / bulk gifting
 * enquiry: the reference number, a recap of what they asked for, and what
 * happens next. Best-effort — the enquiry is already saved.
 */
export const giftEnquiryConfirmation = ({ ticketId, name, quantity, occasion, deliveryDate, products = [] }) => {
    const refCard = `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
  <tr>
    <td align="center" style="background-color:${BRAND.warm};border:1px solid ${BRAND.border};border-radius:12px;padding:20px 24px;">
      <p style="margin:0 0 6px;font-family:${FONT_BODY};font-size:11px;font-weight:bold;letter-spacing:0;text-transform:uppercase;color:${BRAND.muted};">Your enquiry reference</p>
      <p style="margin:0;font-family:${FONT_DISPLAY};font-size:26px;letter-spacing:1px;color:${BRAND.oxblood};">${esc(ticketId)}</p>
    </td>
  </tr>
</table>`;

    const detail = (label, value) => `
<tr>
  <td style="padding:0 0 14px;">
    <p style="margin:0 0 4px;font-family:${FONT_BODY};font-size:10px;font-weight:bold;letter-spacing:0;text-transform:uppercase;color:${BRAND.muted};">${esc(label)}</p>
    <p style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:22px;color:${BRAND.ink};">${value}</p>
  </td>
</tr>`;

    const bodyHtml = `
${eyebrow("Corporate gifting")}
${heading("Your gifting brief is with us")}
${paragraph(`Hi ${firstName(name)},`)}
${paragraph("Thank you for thinking of Energyflow. Our gifting team will review your brief and get back to you within one working day with box options, volume pricing and delivery timelines. Just reply to this email if there's anything you'd like to add.")}
${refCard}
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top:1px solid ${BRAND.border};padding-top:8px;margin-top:8px;">
  ${detail("Quantity", `${esc(Number(quantity).toLocaleString("en-IN"))} boxes`)}
  ${detail("Occasion", esc(occasion))}
  ${deliveryDate ? detail("Needed by", esc(deliveryDate)) : ""}
  ${products.length ? detail("Boxes you liked", products.map((p) => esc(p.name)).join(", ")) : ""}
</table>`;

    return emailShell({
        preheader: `We've received your gifting enquiry — reference ${ticketId}.`,
        title: "Your gifting enquiry",
        bodyHtml,
    });
};
