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
    formatINR,
    esc,
} from "./_shared";

/**
 * Order-confirmation email. Unlike the old version (which showed only an order
 * id and a row of dead placeholder links), this renders the full, payment-aware
 * summary a customer expects: line items, totals, the exact amount paid vs due,
 * and the shipping address — all server-computed values passed in by the route.
 *
 * Every field is optional/guarded so a partial payload can never throw; missing
 * sections simply collapse.
 *
 * @param {object} data
 * @param {string}  data.name
 * @param {string}  data.order_id
 * @param {string}  data.orderDetailsUrl
 * @param {Array}   [data.items]              [{ name, qty, sellingPrice }]
 * @param {number}  [data.subtotal]
 * @param {number}  [data.couponDiscountAmount]
 * @param {number}  [data.totalAmount]
 * @param {'cod'|'full'|'partial'} [data.paymentMethod]
 * @param {number}  [data.paidAmount]
 * @param {number}  [data.remainingAmount]
 * @param {object}  [data.address]           { address, landmark, city, state, pincode, country }
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
        totalAmount = 0,
        paymentMethod = "full",
        paidAmount = 0,
        remainingAmount = 0,
        address = {},
        phone,
    } = data;

    // ── Line items ──
    const itemRows = (Array.isArray(items) ? items : [])
        .map(
            (it) => `
<tr>
  <td style="padding:14px 0;border-bottom:1px solid ${BRAND.border};font-family:${FONT_BODY};font-size:14px;line-height:20px;color:${BRAND.ink};">
    ${esc(it?.name) || "Item"}
    <span style="color:${BRAND.muted};">&nbsp;×&nbsp;${esc(it?.qty ?? 1)}</span>
  </td>
  <td align="right" style="padding:14px 0;border-bottom:1px solid ${BRAND.border};font-family:${FONT_BODY};font-size:14px;line-height:20px;color:${BRAND.ink};white-space:nowrap;">
    ${formatINR((Number(it?.sellingPrice) || 0) * (Number(it?.qty) || 1))}
  </td>
</tr>`
        )
        .join("");

    const itemsTable = itemRows
        ? `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
  ${itemRows}
</table>`
        : "";

    // ── Totals ──
    const totalLine = (label, value, opts = {}) => `
<tr>
  <td style="padding:6px 0;font-family:${FONT_BODY};font-size:${opts.strong ? "16px" : "14px"};line-height:20px;color:${opts.strong ? BRAND.oxblood : BRAND.body};${opts.strong ? "font-weight:bold;" : ""}">${esc(label)}</td>
  <td align="right" style="padding:6px 0;font-family:${FONT_BODY};font-size:${opts.strong ? "16px" : "14px"};line-height:20px;color:${opts.color || (opts.strong ? BRAND.oxblood : BRAND.ink)};${opts.strong ? "font-weight:bold;" : ""}white-space:nowrap;">${esc(value)}</td>
</tr>`;

    const totalsTable = `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:6px 0 0;border-top:1px solid ${BRAND.border};padding-top:8px;">
  ${totalLine("Subtotal", formatINR(subtotal))}
  ${Number(couponDiscountAmount) > 0 ? totalLine("Discount", `– ${formatINR(couponDiscountAmount)}`, { color: BRAND.success }) : ""}
  <tr><td colspan="2" style="border-top:1px solid ${BRAND.border};font-size:0;line-height:0;padding-top:6px;">&nbsp;</td></tr>
  ${totalLine("Total", formatINR(totalAmount), { strong: true })}
</table>`;

    // ── Payment status (method + paid/due) ──
    const isCod = paymentMethod === "cod";
    const isPartial = paymentMethod === "partial";
    const paymentLabel = isCod
        ? "Cash on Delivery"
        : isPartial
            ? "Partial Payment"
            : "Paid in Full";
    const paymentDetail = isCod
        ? `Please keep <strong style="color:${BRAND.ink};">${esc(formatINR(remainingAmount || totalAmount))}</strong> ready to pay on delivery.`
        : isPartial
            ? `You've paid <strong style="color:${BRAND.success};">${esc(formatINR(paidAmount))}</strong>. The remaining <strong style="color:${BRAND.ink};">${esc(formatINR(remainingAmount))}</strong> is due on delivery.`
            : `You've paid <strong style="color:${BRAND.success};">${esc(formatINR(paidAmount || totalAmount))}</strong> in full. Nothing more to pay.`;

    const paymentBlock = `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
  <tr>
    <td style="background-color:${BRAND.warm};border:1px solid ${BRAND.border};border-radius:12px;padding:18px 20px;">
      <p style="margin:0 0 4px;font-family:${FONT_BODY};font-size:11px;font-weight:bold;letter-spacing:0;text-transform:uppercase;color:${BRAND.muted};">Payment · ${esc(paymentLabel)}</p>
      <p style="margin:0;font-family:${FONT_BODY};font-size:14px;line-height:22px;color:${BRAND.body};">${paymentDetail}</p>
    </td>
  </tr>
</table>`;

    // ── Shipping address ──
    const addrLine = [
        esc(address?.address),
        esc(address?.landmark),
        [esc(address?.city), esc(address?.state), esc(address?.pincode)].filter(Boolean).join(", "),
        esc(address?.country),
    ]
        .filter(Boolean)
        .join("<br />");

    const addressBlock = addrLine
        ? `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
  <tr>
    <td style="padding-top:4px;">
      <p style="margin:0 0 6px;font-family:${FONT_BODY};font-size:11px;font-weight:bold;letter-spacing:0;text-transform:uppercase;color:${BRAND.muted};">Shipping to</p>
      <p style="margin:0;font-family:${FONT_BODY};font-size:14px;line-height:22px;color:${BRAND.ink};">
        ${esc(name)}<br />${addrLine}${phone ? `<br />${esc(phone)}` : ""}
      </p>
    </td>
  </tr>
</table>`
        : "";

    // ── Status timeline (Confirmed → Shipped → Delivered) ──
    const step = (label, active) => `
<td align="center" width="33%" style="font-family:${FONT_BODY};font-size:11px;font-weight:bold;letter-spacing:0;text-transform:uppercase;color:${active ? BRAND.oxblood : BRAND.muted};padding-top:8px;">
  <div style="width:12px;height:12px;border-radius:50%;background-color:${active ? BRAND.crimson : BRAND.border};margin:0 auto 8px;"></div>
  ${esc(label)}
</td>`;
    const timeline = `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:28px 0 4px;">
  <tr>${step("Confirmed", true)}${step("Shipped", false)}${step("Delivered", false)}</tr>
</table>`;

    const bodyHtml = `
${eyebrow("Order Confirmed")}
${heading(`Thank you, ${firstName(name)}!`)}
${paragraph("We've received your order and our makers are getting it ready. Here's a summary for your records.")}

<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:4px 0 8px;">
  <tr>
    <td style="font-family:${FONT_BODY};font-size:13px;color:${BRAND.muted};">Order ID</td>
    <td align="right" style="font-family:${FONT_DISPLAY};font-size:16px;font-weight:bold;color:${BRAND.oxblood};">${esc(order_id)}</td>
  </tr>
</table>

${timeline}
${itemsTable}
${totalsTable}
${paymentBlock}
${addressBlock}

<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:30px 0 8px;">
  <tr><td align="center">${button("View my order", esc(orderDetailsUrl))}</td></tr>
</table>
${paragraph("We'll email you again as soon as your order ships. Questions? Just reply to this email or reach us through our contact page.")}`;

    return emailShell({
        preheader: `Order ${order_id} confirmed — thank you for shopping with Energyflow.`,
        title: "Order confirmed",
        bodyHtml,
    });
};
