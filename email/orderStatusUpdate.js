import {
    BRAND,
    emailShell,
    eyebrow,
    heading,
    paragraph,
    idRow,
    timeline,
    detailRows,
    panel,
    label,
    ctaRow,
    link,
    firstName,
    esc,
} from "./_shared";

/**
 * Per-status copy. Only customer-meaningful transitions get an email —
 * internal states like "pending"/"unverified" are excluded by the caller.
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
const TIMELINE = ["Confirmed", "Shipped", "Delivered"];

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
 * @param {object} [data.shipment]        { courier, awb, trackingUrl } — rendered
 *                                        on the "shipped" mail when present, so the
 *                                        customer gets the AWB without signing in.
 */
export const orderStatusUpdate = (data = {}) => {
    const { name, order_id, status, orderDetailsUrl = "#", shipment = {} } = data;
    const copy = STATUS_COPY[status] || STATUS_COPY.processing;
    const cancelled = status === "cancelled";

    const { courier, awb, trackingUrl } = shipment || {};

    // Courier details only make sense once the parcel is actually moving.
    const trackingBlock =
        status === "shipped" && (courier || awb || trackingUrl)
            ? panel(
                `${label("Tracking")}
      ${detailRows(
                    [
                        ["Courier", esc(courier)],
                        ["Tracking number (AWB)", esc(awb)],
                        ["Track online", trackingUrl ? link("Open tracking page", trackingUrl) : ""],
                    ],
                    { gap: 12 }
                )}`,
                { margin: "20px 0 4px", pad: "18px 20px 6px" }
            )
            : "";

    // Prefer the courier's own tracking page as the CTA when we have one.
    const ctaUrl = status === "shipped" && trackingUrl ? trackingUrl : orderDetailsUrl;

    const bodyHtml = `
${eyebrow(copy.eyebrow)}
${heading(copy.title)}
${paragraph(`Hi ${firstName(name)},`)}
${paragraph(copy.lead)}
${idRow("Order ID", order_id)}
${cancelled ? "" : timeline(TIMELINE, stageIndexFor(status))}
${trackingBlock}
${ctaRow(copy.cta, ctaUrl, { top: 28, bottom: 8, bg: BRAND.pine })}`;

    return emailShell({
        preheader: order_id ? `${copy.title} — order ${order_id}.` : `${copy.title}.`,
        title: copy.title,
        bodyHtml,
    });
};
