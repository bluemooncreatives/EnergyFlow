import {
    BRAND,
    FONT_BODY,
    TYPE,
    emailShell,
    eyebrow,
    heading,
    paragraph,
    idRow,
    timeline,
    itemRows,
    totalsTable,
    panel,
    label,
    fieldValue,
    addressHtml,
    ctaRow,
    firstName,
    formatINR,
    esc,
} from "./_shared";

/**
 * Order-confirmation email: the full, payment-aware summary a customer
 * expects — line items, totals, the exact amount paid vs due, and the
 * shipping address — all server-computed values passed in by the route.
 *
 * Every field is optional/guarded so a partial payload can never throw;
 * missing sections simply collapse.
 *
 * @param {object} data
 * @param {string}  data.name
 * @param {string}  data.order_id
 * @param {string}  data.orderDetailsUrl
 * @param {Array}   [data.items]              [{ name, qty, sellingPrice }]
 * @param {number}  [data.subtotal]
 * @param {number}  [data.couponDiscountAmount]
 * @param {number}  [data.deliveryCharge]
 * @param {number}  [data.totalAmount]
 * @param {'cod'|'full'|'partial'} [data.paymentMethod]
 * @param {number}  [data.paidAmount]
 * @param {number}  [data.remainingAmount]
 * @param {object}  [data.address]            { address, landmark, city, state, pincode, country }
 * @param {string}  [data.phone]
 */
export const orderNotification = (data = {}) => {
    const {
        name,
        order_id,
        orderDetailsUrl = "#",
        items = [],
        subtotal = 0,
        couponDiscountAmount = 0,
        deliveryCharge = 0,
        totalAmount = 0,
        paymentMethod = "full",
        paidAmount = 0,
        remainingAmount = 0,
        address = {},
        phone,
    } = data;

    // ── Line items ──
    const rows = itemRows(items);
    const itemsTable = rows
        ? `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
  ${rows}
</table>`
        : "";

    // ── Payment status (method + paid/due) ──
    const isCod = paymentMethod === "cod";
    const isPartial = paymentMethod === "partial";
    const paymentLabel = isCod ? "Cash on Delivery" : isPartial ? "Partial Payment" : "Paid in Full";
    const paymentDetail = isCod
        ? `Please keep <strong style="color:${BRAND.ink};">${esc(formatINR(remainingAmount || totalAmount))}</strong> ready to pay on delivery.`
        : isPartial
            ? `You've paid <strong style="color:${BRAND.success};">${esc(formatINR(paidAmount))}</strong>. The remaining <strong style="color:${BRAND.ink};">${esc(formatINR(remainingAmount))}</strong> is due on delivery.`
            : `You've paid <strong style="color:${BRAND.success};">${esc(formatINR(paidAmount || totalAmount))}</strong> in full. Nothing more to pay.`;

    const paymentBlock = panel(
        `
      ${label(`Payment · ${paymentLabel}`)}
      <p style="margin:0;font-family:${FONT_BODY};font-size:${TYPE.bodyText.size};line-height:${TYPE.bodyText.line};color:${BRAND.body};">${paymentDetail}</p>`,
        { margin: "24px 0 0" }
    );

    // ── Shipping address ──
    const addrLine = addressHtml(address);
    const addressBlock = addrLine
        ? `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
  <tr>
    <td style="padding-top:4px;">
      ${label("Shipping to")}
      ${fieldValue(`${esc(name)}<br />${addrLine}${phone ? `<br />${esc(phone)}` : ""}`)}
    </td>
  </tr>
</table>`
        : "";

    const bodyHtml = `
${eyebrow("Order Confirmed")}
${heading(`Thank you, ${firstName(name)}!`)}
${paragraph("We've received your order and our makers are getting it ready. Here's a summary for your records.")}
${idRow("Order ID", order_id)}
${timeline(["Confirmed", "Shipped", "Delivered"], 0)}
${itemsTable}
${totalsTable({ subtotal, couponDiscountAmount, deliveryCharge, totalAmount })}
${paymentBlock}
${addressBlock}
${ctaRow("View my order", orderDetailsUrl, { top: 30, bottom: 8 })}
${paragraph("We'll email you again as soon as your order ships. Questions? Just reply to this email or reach us through our contact page.")}`;

    return emailShell({
        preheader: order_id
            ? `Order ${order_id} confirmed. Thank you for shopping with Energyflow.`
            : "Your Energyflow order is confirmed. Thank you for shopping with us.",
        title: "Order confirmed",
        bodyHtml,
    });
};
