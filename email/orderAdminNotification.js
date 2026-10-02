import {
    BRAND,
    FONT_BODY,
    FONT_DISPLAY,
    emailShell,
    eyebrow,
    heading,
    button,
    esc,
    formatINR,
    siteUrl,
} from "./_shared";

const PAYMENT_LABEL = {
    cod: "Cash on Delivery",
    full: "Paid online (full)",
    partial: "Part-paid online",
};

/**
 * Internal "new order" alert sent to the store inbox for every order placed
 * (COD, full or partial payment). Everything needed to start fulfilment is
 * inline — customer, contact, items, money, address, note — plus a link to
 * the order in the admin panel. All customer-supplied text is escaped.
 *
 * @param {object} data
 * @param {string}  data.order_id
 * @param {Date}    [data.placedAt]
 * @param {boolean} [data.needsVerification]  online payment couldn't be confirmed with Razorpay
 * @param {string}  data.name / data.email / data.phone
 * @param {Array}   data.items                [{ name, qty, sellingPrice }]
 * @param {number}  data.subtotal / data.couponDiscountAmount / data.totalAmount
 * @param {string}  [data.couponCode]
 * @param {'cod'|'full'|'partial'} data.paymentMethod
 * @param {number}  data.paidAmount / data.remainingAmount
 * @param {string}  [data.payment_id]
 * @param {object}  data.address              { address, landmark, city, state, pincode, country }
 * @param {string}  [data.ordernote]
 */
export const orderAdminNotification = (data = {}) => {
    const {
        order_id,
        placedAt = new Date(),
        needsVerification = false,
        name,
        email,
        phone,
        items = [],
        subtotal = 0,
        couponDiscountAmount = 0,
        couponCode,
        deliveryCharge = 0,
        totalAmount = 0,
        paymentMethod = "full",
        paidAmount = 0,
        remainingAmount = 0,
        payment_id,
        address = {},
        ordernote,
    } = data;

    const label = (text) =>
        `<p style="margin:0 0 4px;font-family:${FONT_BODY};font-size:10px;font-weight:bold;letter-spacing:0;text-transform:uppercase;color:${BRAND.muted};">${esc(text)}</p>`;
    const value = (html) =>
        `<p style="margin:0;font-family:${FONT_BODY};font-size:14px;line-height:21px;color:${BRAND.ink};">${html}</p>`;

    const placed = new Date(placedAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });

    const warning = needsVerification
        ? `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
  <tr><td style="background-color:#FDECEA;border:1px solid ${BRAND.danger};border-radius:10px;padding:14px 16px;font-family:${FONT_BODY};font-size:13px;line-height:20px;color:${BRAND.danger};">
    <strong>Payment needs checking.</strong> The payment signature was valid but Razorpay couldn't be reached to confirm it. Verify payment ${esc(payment_id || "")} in the Razorpay dashboard before shipping.
  </td></tr>
</table>`
        : "";

    // Headline strip: order total + how much is still to collect.
    const dueNow = paymentMethod === "cod" ? totalAmount : remainingAmount;
    const summary = `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
  <tr>
    <td style="background-color:${BRAND.sun};border-radius:12px;padding:16px 20px;">
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td class="ms-stack" style="font-family:${FONT_BODY};color:${BRAND.oxblood};">
            <span style="display:block;font-size:11px;font-weight:bold;text-transform:uppercase;">Order total</span>
            <span style="display:block;font-family:${FONT_DISPLAY};font-size:28px;line-height:34px;font-weight:600;">${esc(formatINR(totalAmount))}</span>
          </td>
          <td class="ms-stack ms-stack-right" align="right" style="font-family:${FONT_BODY};font-size:13px;line-height:20px;color:${BRAND.oxblood};">
            <strong>${esc(PAYMENT_LABEL[paymentMethod] || paymentMethod)}</strong><br />
            Paid ${esc(formatINR(paidAmount))}${Number(dueNow) > 0 ? ` · <strong>Collect ${esc(formatINR(dueNow))} on delivery</strong>` : ""}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

    const itemRows = (Array.isArray(items) ? items : [])
        .map(
            (it) => `
<tr>
  <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-family:${FONT_BODY};font-size:14px;line-height:20px;color:${BRAND.ink};">
    ${esc(it?.name) || "Item"} <span style="color:${BRAND.muted};">× ${esc(it?.qty ?? 1)}</span>
  </td>
  <td align="right" style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-family:${FONT_BODY};font-size:14px;line-height:20px;color:${BRAND.ink};white-space:nowrap;">
    ${formatINR((Number(it?.sellingPrice) || 0) * (Number(it?.qty) || 1))}
  </td>
</tr>`
        )
        .join("");

    const line = (text, amount, strong = false, color) => `
<tr>
  <td style="padding:5px 0;font-family:${FONT_BODY};font-size:14px;color:${strong ? BRAND.oxblood : BRAND.body};${strong ? "font-weight:bold;" : ""}">${text}</td>
  <td align="right" style="padding:5px 0;font-family:${FONT_BODY};font-size:14px;color:${color || (strong ? BRAND.oxblood : BRAND.ink)};${strong ? "font-weight:bold;" : ""}white-space:nowrap;">${amount}</td>
</tr>`;

    const itemsTable = `
${label(`Items (${items.length})`)}
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 6px;">
  ${itemRows}
  ${line("Subtotal", esc(formatINR(subtotal)))}
  ${Number(couponDiscountAmount) > 0 ? line(`Discount${couponCode ? ` (${esc(couponCode)})` : ""}`, `– ${esc(formatINR(couponDiscountAmount))}`, false, BRAND.success) : ""}
  ${Number(deliveryCharge) > 0 ? line("Delivery", esc(formatINR(deliveryCharge))) : ""}
  ${line("Total", esc(formatINR(totalAmount)), true)}
</table>`;

    const addressHtml = [
        esc(address?.address),
        address?.landmark ? `Near ${esc(address.landmark)}` : "",
        [esc(address?.city), esc(address?.state), esc(address?.pincode)].filter(Boolean).join(", "),
        esc(address?.country),
    ]
        .filter(Boolean)
        .join("<br />");

    const details = `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:22px 0 0;">
  <tr>
    <td class="ms-stack" width="50%" valign="top" style="padding:0 12px 18px 0;">
      ${label("Customer")}
      ${value(`${esc(name)}<br /><a href="mailto:${esc(email)}" style="color:${BRAND.crimson};">${esc(email)}</a><br /><a href="tel:${esc(phone)}" style="color:${BRAND.crimson};">${esc(phone)}</a>`)}
    </td>
    <td class="ms-stack" width="50%" valign="top" style="padding:0 0 18px;">
      ${label("Ship to")}
      ${value(addressHtml || "—")}
    </td>
  </tr>
  <tr>
    <td class="ms-stack" valign="top" style="padding:0 12px 18px 0;">
      ${label("Order ID")}
      ${value(`<span style="font-family:${FONT_DISPLAY};font-weight:600;">${esc(order_id)}</span>`)}
    </td>
    <td class="ms-stack" valign="top" style="padding:0 0 18px;">
      ${label("Placed")}
      ${value(`${esc(placed)} IST${payment_id ? `<br /><span style="color:${BRAND.muted};font-size:12px;">Payment ${esc(payment_id)}</span>` : ""}`)}
    </td>
  </tr>
  ${ordernote ? `<tr><td colspan="2" style="padding:0 0 18px;">${label("Customer note")}${value(esc(ordernote))}</td></tr>` : ""}
</table>`;

    const bodyHtml = `
${eyebrow(needsVerification ? "New order · verify payment" : "New order")}
${heading(`New order from ${String(name || "a customer").trim().split(/\s+/)[0]}`)}
${warning}
${summary}
${itemsTable}
${details}
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:8px 0 0;">
  <tr>
    <td style="border-top:1px solid ${BRAND.border};padding-top:24px;">
      ${button("Open order in admin", `${siteUrl()}/admin/orders/details/${encodeURIComponent(order_id || "")}`)}
    </td>
  </tr>
</table>`;

    return emailShell({
        preheader: `${formatINR(totalAmount)} · ${PAYMENT_LABEL[paymentMethod] || paymentMethod} · ${items.length} item(s) · ${name || ""}`,
        title: "New order received",
        bodyHtml,
    });
};
