import {
    BRAND,
    emailShell,
    eyebrow,
    heading,
    paragraph,
    valueCard,
    detailRows,
    ctaRow,
    fineprint,
    firstName,
    formatCount,
    esc,
    siteUrl,
} from "./_shared";

/**
 * Acknowledgement sent to the customer after a corporate / bulk gifting
 * enquiry: the reference number, a recap of what they asked for, and what
 * happens next. Best-effort — the enquiry is already saved.
 */
export const giftEnquiryConfirmation = ({ ticketId, name, quantity, occasion, deliveryDate, products = [] }) => {
    const list = Array.isArray(products) ? products : [];

    const bodyHtml = `
${eyebrow("Corporate gifting")}
${heading("Your gifting brief is with us")}
${paragraph(`Hi ${firstName(name)},`)}
${paragraph("Thank you for thinking of Energyflow. Our gifting team will review your brief and get back to you within one working day with box options, volume pricing and delivery timelines. Just reply to this email if there's anything you'd like to add.")}
${valueCard({ caption: "Your enquiry reference", value: ticketId, size: "26px", tracking: "2px" })}
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top:1px solid ${BRAND.border};margin-top:8px;">
  <tr><td style="padding-top:20px;">
    ${detailRows([
        ["Quantity", `${esc(formatCount(quantity))} boxes`],
        ["Occasion", esc(occasion)],
        ["Needed by", esc(deliveryDate)],
        ["Boxes you liked", list.map((p) => esc(p?.name)).filter(Boolean).join(", ")],
    ], { gap: 14 })}
  </td></tr>
</table>
${ctaRow("Track your enquiry", `${siteUrl()}/my-account/enquiries?ref=${encodeURIComponent(ticketId || "")}`, { top: 16, bottom: 0 })}
${fineprint("Sign in with this email address to see live updates.")}`;

    return emailShell({
        preheader: `We've received your gifting enquiry - reference ${ticketId}.`,
        title: "Your gifting enquiry",
        bodyHtml,
    });
};
