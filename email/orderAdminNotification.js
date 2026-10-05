import {
    BRAND,
    FONT_BODY,
    FONT_DISPLAY,
    TYPE,
    emailShell,
    eyebrow,
    heading,
    highlightBand,
    alertPanel,
    label,
    detailRows,
    itemRows,
    totalsTable,
    addressHtml,
    ctaRowRuled,
    mailLink,
    telLink,
    esc,
    formatINR,
    formatDateTime,
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
 * @param {number}  data.subtotal / data.couponDiscountAmount / data.deliveryCharge / data.totalAmount
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

    const itemCount = Array.isArray(items) ? items.length : 0;

    const warning = needsVerification
        ? alertPanel(
            `<strong>Payment needs checking.</strong> The payment signature was valid but Razorpay couldn't be reached to confirm it. Verify payment ${esc(payment_id || "")} in the Razorpay dashboard before shipping.`
        )
        : "";

    // Headline strip: order total + how much is still to collect.
    const dueNow = paymentMethod === "cod" ? totalAmount : remainingAmount;
    const summary = highlightBand(`
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td class="ms-stack" style="font-family:${FONT_BODY};color:${BRAND.sunInk};">
            <span style="display:block;font-size:${TYPE.eyebrow};font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Order total</span>
            <span style="display:block;font-family:${FONT_DISPLAY};font-size:28px;line-height:34px;font-weight:600;">${esc(formatINR(totalAmount))}</span>
          </td>
          <td class="ms-stack ms-stack-right" align="right" style="font-family:${FONT_BODY};font-size:${TYPE.small.size};line-height:${TYPE.small.line};color:${BRAND.sunInk};">
            <strong>${esc(PAYMENT_LABEL[paymentMethod] || paymentMethod)}</strong><br />
            Paid ${esc(formatINR(paidAmount))}${Number(dueNow) > 0 ? ` · <strong>Collect ${esc(formatINR(dueNow))} on delivery</strong>` : ""}
          </td>
        </tr>
      </table>`);

    const itemsTable = `
${label(`Items (${itemCount})`)}
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 6px;">
  ${itemRows(items, { pad: 10 })}
</table>
${totalsTable({ subtotal, couponDiscountAmount, couponCode, deliveryCharge, totalAmount, topRule: false })}`;

    // Two-up grid on desktop, stacked on mobile (.ms-stack).
    const grid = `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:22px 0 0;">
  <tr>
    <td class="ms-stack" width="50%" valign="top" style="padding:0 12px 18px 0;">
      ${detailRows([
        [
            "Customer",
            [esc(name), mailLink(email), telLink(phone)].filter(Boolean).join("<br />"),
        ],
    ], { gap: 0 })}
    </td>
    <td class="ms-stack" width="50%" valign="top" style="padding:0 0 18px;">
      ${detailRows([["Ship to", addressHtml(address, { landmarkPrefix: "Near " }) || "—"]], { gap: 0 })}
    </td>
  </tr>
  <tr>
    <td class="ms-stack" valign="top" style="padding:0 12px 18px 0;">
      ${detailRows([
        ["Order ID", `<span style="font-family:${FONT_DISPLAY};font-weight:600;">${esc(order_id)}</span>`],
    ], { gap: 0 })}
    </td>
    <td class="ms-stack" valign="top" style="padding:0 0 18px;">
      ${detailRows([
        [
            "Placed",
            `${esc(formatDateTime(placedAt))} IST${payment_id ? `<br /><span style="color:${BRAND.muted};font-size:${TYPE.tiny.size};">Payment ${esc(payment_id)}</span>` : ""}`,
        ],
    ], { gap: 0 })}
    </td>
  </tr>
  ${ordernote
            ? `<tr><td colspan="2" style="padding:0 0 18px;">${detailRows([["Customer note", esc(ordernote), { wrap: true }]], { gap: 0 })}</td></tr>`
            : ""}
</table>`;

    const bodyHtml = `
${eyebrow(needsVerification ? "New order · verify payment" : "New order")}
${heading(`New order from ${String(name || "a customer").trim().split(/\s+/)[0]}`)}
${warning}
${summary}
${itemsTable}
${grid}
${ctaRowRuled("Open order in admin", `${siteUrl()}/admin/orders/details/${encodeURIComponent(order_id || "")}`)}`;

    return emailShell({
        preheader: `${formatINR(totalAmount)} · ${PAYMENT_LABEL[paymentMethod] || paymentMethod} · ${itemCount} item(s) · ${name || ""}`,
        title: "New order received",
        bodyHtml,
    });
};
