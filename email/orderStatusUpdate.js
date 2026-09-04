import {
    BRAND,
    FONT_BODY,
    FONT_DISPLAY,
    emailShell,
    eyebrow,
    heading,
    paragraph,
    button,
    firstName,
    esc,
} from "./_shared";

/**
 * Per-status copy. Only customer-meaningful transitions get an email — internal
 * states like "pending"/"unverified" are intentionally excluded by the caller.
 */
const STATUS_COPY = {
    processing: {
        eyebrow: "Order Update",
        title: "We're preparing your order",
        lead: "Good news — your order is now being prepared by our makers. We'll let you know the moment it ships.",
        cta: "View my order",
    },
    shipped: {
        eyebrow: "On its way",
        title: "Your order has shipped",
        lead: "Your order is on its way to you. Track its progress or view the details any time from your account.",
        cta: "Track my order",
    },
    delivered: {
        eyebrow: "Delivered",
        title: "Your order has arrived",
        lead: "Your order has been delivered. We hope you love it! If anything isn't quite right, just reply to this email — we're here to help.",
        cta: "View my order",
    },
    cancelled: {
        eyebrow: "Order Update",
        title: "Your order was cancelled",
        lead: "Your order has been cancelled. If you paid online, any eligible refund will be processed to your original payment method. Reach out if you have any questions.",
        cta: "View my order",
    },
};

// Ordered customer-facing journey used to render the progress timeline.
const TIMELINE = ["confirmed", "shipped", "delivered"];

const stageIndexFor = (status) => {
    if (status === "delivered") return 2;
    if (status === "shipped") return 1;
    // processing / cancelled / anything else → confirmed stage
    return 0;
};

/**
 * Order status-change notification, fired from the admin "update status" action.
 *
 * @param {object} data
 * @param {string} data.name
 * @param {string} data.order_id
 * @param {string} data.status            One of processing|shipped|delivered|cancelled.
 * @param {string} data.orderDetailsUrl
 */
export const orderStatusUpdate = (data = {}) => {
    const { name, order_id, status, orderDetailsUrl = "#" } = data;
    const copy = STATUS_COPY[status] || STATUS_COPY.processing;
    const cancelled = status === "cancelled";

    const activeIndex = stageIndexFor(status);
    const timeline = cancelled
        ? ""
        : `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
  <tr>
    ${TIMELINE.map((label, i) => {
        const active = i <= activeIndex;
        return `<td align="center" width="33%" style="font-family:${FONT_BODY};font-size:11px;font-weight:bold;letter-spacing:0;text-transform:uppercase;color:${active ? BRAND.oxblood : BRAND.muted};padding-top:8px;">
      <div style="width:12px;height:12px;border-radius:50%;background-color:${active ? BRAND.crimson : BRAND.border};margin:0 auto 8px;"></div>
      ${esc(label)}
    </td>`;
    }).join("")}
  </tr>
</table>`;

    const bodyHtml = `
${eyebrow(copy.eyebrow)}
${heading(copy.title)}
${paragraph(`Hi ${firstName(name)},`)}
${paragraph(copy.lead)}
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:4px 0 8px;">
  <tr>
    <td style="font-family:${FONT_BODY};font-size:13px;color:${BRAND.muted};">Order ID</td>
    <td align="right" style="font-family:${FONT_DISPLAY};font-size:16px;font-weight:bold;color:${BRAND.oxblood};">${esc(order_id)}</td>
  </tr>
</table>
${timeline}
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
  <tr><td align="center">${button(copy.cta, esc(orderDetailsUrl), cancelled ? BRAND.crimson : BRAND.oxblood)}</td></tr>
</table>`;

    return emailShell({
        preheader: `${copy.title} — order ${order_id}.`,
        title: copy.title,
        bodyHtml,
    });
};
