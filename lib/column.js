import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import dayjs from "dayjs"
import { Star } from "lucide-react"
import { cn, initialsOf } from "@/lib/utils"
import { BUDGETS, ENQUIRY_STATUSES, OCCASIONS, labelFor } from "@/lib/giftEnquiry"

// ── Shared cell renderers ───────────────────────────────────────────
// Every admin table formats values the same way: rupees with Indian
// grouping, "28 Sep 2026" dates, tone pills for states, "—" for empties.

const Empty = () => <span className="text-muted-foreground/60">-</span>

const isEmpty = (value) => value === null || value === undefined || value === '' || value === '-'

export const Money = ({ value, strong = false }) => {
    const n = Number(value)
    if (isEmpty(value) || !Number.isFinite(n)) return <Empty />
    return (
        <span className={cn('tabular-nums', strong && 'font-semibold')}>
            {n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2, minimumFractionDigits: 0 })}
        </span>
    )
}

export const Truncate = ({ value, width = 'max-w-[220px]', muted = false }) => {
    if (isEmpty(value)) return <Empty />
    const text = String(value)
    return <span className={cn('block truncate', width, muted && 'text-muted-foreground')} title={text}>{text}</span>
}

// Tone pill built on the design-system status tones (ef-tone--*).
export const Pill = ({ tone = 'pine', children, dot = true }) => (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', `ef-tone--${tone}`)}>
        {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
        {children}
    </span>
)

const ORDER_TONE = {
    pending: 'sun',
    processing: 'olive',
    shipped: 'pine',
    delivered: 'forest',
    cancelled: 'danger',
    unverified: 'danger',
}

const PAYMENT_TONE = { fully_paid: 'forest', partial_paid: 'sun', unpaid: 'danger' }
const PAYMENT_LABEL = { fully_paid: 'Paid', partial_paid: 'Part paid', unpaid: 'Unpaid' }
const METHOD_LABEL = { cod: 'COD', full: 'Prepaid', partial: 'Part prepaid' }

export const OrderStatus = ({ value }) =>
    isEmpty(value) ? <Empty /> : <Pill tone={ORDER_TONE[value] || 'pine'}>{String(value).replace(/_/g, ' ')}</Pill>

export const Stars = ({ value }) => {
    const rating = Math.max(0, Math.min(5, Math.round(Number(value) || 0)))
    return (
        <span className="inline-flex items-center gap-1" aria-label={`${rating} out of 5`}>
            <span className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} aria-hidden="true" className={cn('size-3.5', i < rating ? 'fill-[var(--brand-gold)] text-[var(--brand-gold)]' : 'text-foreground/20')} />
                ))}
            </span>
            <span className="text-xs font-semibold tabular-nums">{rating}.0</span>
        </span>
    )
}


export const Person = ({ name, sub, avatar }) => (
    <span className="flex min-w-0 items-center gap-3">
        <Avatar className="size-8 shrink-0">
            {avatar && <AvatarImage src={avatar} alt="" />}
            <AvatarFallback className="bg-secondary text-[0.6875rem] font-semibold text-primary">{initialsOf(name)}</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-col leading-tight">
            <span className="max-w-[200px] truncate font-medium" title={name}>{name || 'Unknown'}</span>
            {sub && <span className="max-w-[220px] truncate text-xs text-muted-foreground" title={sub}>{sub}</span>}
        </span>
    </span>
)

const Mono = ({ value }) => (isEmpty(value) ? <Empty /> : <span className="font-mono text-xs">{value}</span>)

const Percent = ({ value }) => {
    const n = Number(value)
    if (!Number.isFinite(n) || n <= 0) return <span className="text-muted-foreground">0%</span>
    return <Pill tone="sun" dot={false}>{Math.round(n)}% off</Pill>
}

// ── Tables ──────────────────────────────────────────────────────────

export const DT_CATEGORY_COLUMN = [
    { accessorKey: 'name', header: 'Category Name', Cell: ({ renderedCellValue }) => <span className="font-medium">{renderedCellValue}</span> },
    { accessorKey: 'slug', header: 'Slug', Cell: ({ renderedCellValue }) => <Mono value={renderedCellValue} /> },
]

export const DT_PRODUCT_COLUMN = [
    { accessorKey: 'name', header: 'Product Name', Cell: ({ renderedCellValue }) => <Truncate value={renderedCellValue} width="max-w-[260px] font-medium" /> },
    { accessorKey: 'slug', header: 'Slug', hidden: true, Cell: ({ renderedCellValue }) => <Mono value={renderedCellValue} /> },
    { accessorKey: 'category', header: 'Category', Cell: ({ renderedCellValue }) => isEmpty(renderedCellValue) ? <Empty /> : <Pill tone="pine" dot={false}>{String(renderedCellValue).trim()}</Pill> },
    { accessorKey: 'mrp', header: 'MRP', Cell: ({ renderedCellValue }) => <span className="text-muted-foreground"><Money value={renderedCellValue} /></span> },
    { accessorKey: 'sellingPrice', header: 'Selling Price', Cell: ({ renderedCellValue }) => <Money value={renderedCellValue} strong /> },
    { accessorKey: 'discountPercentage', header: 'Discount', Cell: ({ renderedCellValue }) => <Percent value={renderedCellValue} /> },
]

export const DT_PRODUCT_VARIANT_COLUMN = [
    { accessorKey: 'product', header: 'Product Name', Cell: ({ renderedCellValue }) => <Truncate value={renderedCellValue} width="max-w-[240px] font-medium" /> },
    { accessorKey: 'size', header: 'Pack Size', Cell: ({ renderedCellValue }) => isEmpty(renderedCellValue) ? <Empty /> : <Pill tone="olive" dot={false}>{renderedCellValue}</Pill> },
    { accessorKey: 'sku', header: 'SKU', Cell: ({ renderedCellValue }) => <Mono value={renderedCellValue} /> },
    { accessorKey: 'mrp', header: 'MRP', Cell: ({ renderedCellValue }) => <span className="text-muted-foreground"><Money value={renderedCellValue} /></span> },
    { accessorKey: 'sellingPrice', header: 'Selling Price', Cell: ({ renderedCellValue }) => <Money value={renderedCellValue} strong /> },
    { accessorKey: 'discountPercentage', header: 'Discount', Cell: ({ renderedCellValue }) => <Percent value={renderedCellValue} /> },
]

export const DT_COUPON_COLUMN = [
    { accessorKey: 'code', header: 'Code', Cell: ({ renderedCellValue }) => <span className="rounded-md border border-dashed border-primary/40 bg-secondary px-2 py-0.5 font-mono text-xs font-semibold tracking-wider">{renderedCellValue}</span> },
    { accessorKey: 'discountPercentage', header: 'Discount', Cell: ({ renderedCellValue }) => <Percent value={renderedCellValue} /> },
    { accessorKey: 'minShoppingAmount', header: 'Min. Order', Cell: ({ renderedCellValue }) => <Money value={renderedCellValue} /> },
    {
        accessorKey: 'validity',
        header: 'Valid Until',
        Cell: ({ renderedCellValue }) => {
            const d = dayjs(renderedCellValue)
            if (!d.isValid()) return <Empty />
            const expired = dayjs().isAfter(d)
            const soon = !expired && d.diff(dayjs(), 'day') <= 7
            return (
                <span className="flex items-center gap-2">
                    <span>{d.format('DD MMM YYYY')}</span>
                    <Pill tone={expired ? 'danger' : soon ? 'sun' : 'forest'}>{expired ? 'Expired' : soon ? `${Math.max(0, d.diff(dayjs(), 'day'))}d left` : 'Active'}</Pill>
                </span>
            )
        },
    },
]

export const DT_CUSTOMERS_COLUMN = [
    {
        accessorKey: 'name',
        header: 'Customer',
        Cell: ({ row }) => <Person name={row.original.name} sub={row.original.email} avatar={row.original.avatar?.url} />,
    },
    { accessorKey: 'email', header: 'Email', hidden: true, Cell: ({ renderedCellValue }) => <Truncate value={renderedCellValue} /> },
    { accessorKey: 'phone', header: 'Phone', Cell: ({ renderedCellValue }) => isEmpty(renderedCellValue) ? <Empty /> : <span className="tabular-nums">{renderedCellValue}</span> },
    { accessorKey: 'address', header: 'Address', Cell: ({ renderedCellValue }) => <Truncate value={renderedCellValue} muted /> },
    {
        accessorKey: 'isEmailVerified',
        header: 'Email Status',
        Cell: ({ renderedCellValue }) => renderedCellValue ? <Pill tone="forest">Verified</Pill> : <Pill tone="danger">Not verified</Pill>,
    },
]

export const DT_REVIEW_COLUMN = [
    { accessorKey: 'product', header: 'Product', Cell: ({ renderedCellValue }) => <Truncate value={renderedCellValue} width="max-w-[200px] font-medium" /> },
    { accessorKey: 'user', header: 'Reviewer', Cell: ({ renderedCellValue }) => <Person name={renderedCellValue || 'Deleted user'} /> },
    { accessorKey: 'isDraft', header: 'Status', enableSorting: false, Cell: ({ renderedCellValue }) => <Pill tone={renderedCellValue ? 'sun' : 'forest'}>{renderedCellValue ? 'Draft' : 'Live'}</Pill> },
    { accessorKey: 'rating', header: 'Rating', Cell: ({ renderedCellValue }) => <Stars value={renderedCellValue} /> },
    { accessorKey: 'title', header: 'Title', Cell: ({ renderedCellValue }) => <Truncate value={renderedCellValue} width="max-w-[200px] font-medium" /> },
    { accessorKey: 'review', header: 'Review', Cell: ({ renderedCellValue }) => <Truncate value={renderedCellValue} width="max-w-[320px]" muted /> },
]

export const DT_CONTACT_COLUMN = [
    { accessorKey: 'ticketId', header: 'Query ID', Cell: ({ renderedCellValue }) => <Mono value={renderedCellValue} /> },
    { accessorKey: 'name', header: 'From', Cell: ({ row }) => <Person name={row.original.name} sub={row.original.email} /> },
    { accessorKey: 'email', header: 'Email', hidden: true, Cell: ({ renderedCellValue }) => <Truncate value={renderedCellValue} /> },
    { accessorKey: 'phone', header: 'Mobile', Cell: ({ renderedCellValue }) => isEmpty(renderedCellValue) ? <Empty /> : <span className="tabular-nums">{renderedCellValue}</span> },
    { accessorKey: 'address', header: 'Address', hidden: true, Cell: ({ renderedCellValue }) => <Truncate value={renderedCellValue} muted /> },
    { accessorKey: 'subject', header: 'Subject', Cell: ({ renderedCellValue }) => <Truncate value={renderedCellValue} width="max-w-[200px] font-medium" /> },
    { accessorKey: 'message', header: 'Message', Cell: ({ renderedCellValue }) => <Truncate value={renderedCellValue} width="max-w-[280px]" muted /> },
    { accessorKey: 'isRead', header: 'Status', Cell: ({ renderedCellValue }) => renderedCellValue ? <Pill tone="forest">Read</Pill> : <Pill tone="sun">New</Pill> },
]

const ENQUIRY_STATUS = Object.fromEntries(ENQUIRY_STATUSES.map((s) => [s.value, s]))

export const DT_GIFT_ENQUIRY_COLUMN = [
    { accessorKey: 'ticketId', header: 'Ref', Cell: ({ renderedCellValue }) => <Mono value={renderedCellValue} /> },
    {
        accessorKey: 'name',
        header: 'From',
        Cell: ({ row }) => (
            <span className="flex items-center gap-2">
                {!row.original.isRead && <span className="size-2 shrink-0 rounded-full bg-[var(--brand-sun)]" title="Unread" aria-label="Unread" />}
                <Person name={row.original.name} sub={row.original.company || row.original.email} />
            </span>
        ),
    },
    { accessorKey: 'company', header: 'Company', hidden: true, Cell: ({ renderedCellValue }) => isEmpty(renderedCellValue) ? <Empty /> : <Truncate value={renderedCellValue} /> },
    { accessorKey: 'email', header: 'Email', hidden: true, Cell: ({ renderedCellValue }) => <Truncate value={renderedCellValue} /> },
    { accessorKey: 'phone', header: 'Phone', Cell: ({ renderedCellValue }) => isEmpty(renderedCellValue) ? <Empty /> : <span className="tabular-nums">{renderedCellValue}</span> },
    { accessorKey: 'quantity', header: 'Boxes', Cell: ({ renderedCellValue }) => <span className="font-semibold tabular-nums">{Number(renderedCellValue || 0).toLocaleString('en-IN')}</span> },
    { accessorKey: 'occasion', header: 'Occasion', Cell: ({ renderedCellValue }) => <Pill tone="pine" dot={false}>{labelFor(OCCASIONS, renderedCellValue)}</Pill> },
    { accessorKey: 'budget', header: 'Budget / box', Cell: ({ renderedCellValue }) => isEmpty(renderedCellValue) ? <Empty /> : <span>{labelFor(BUDGETS, renderedCellValue)}</span> },
    { accessorKey: 'deliveryDate', header: 'Needed By', Cell: ({ renderedCellValue }) => renderedCellValue ? <span className="tabular-nums">{dayjs(renderedCellValue).format('DD MMM YYYY')}</span> : <Empty /> },
    { accessorKey: 'city', header: 'City', hidden: true, Cell: ({ renderedCellValue }) => isEmpty(renderedCellValue) ? <Empty /> : <span>{renderedCellValue}</span> },
    {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ renderedCellValue }) => {
            const status = ENQUIRY_STATUS[renderedCellValue] || ENQUIRY_STATUS.new
            return <Pill tone={status.tone}>{status.label}</Pill>
        },
    },
]

const NEWSLETTER_SOURCE_LABEL ={ popup: 'Popup', section: 'Homepage band', footer: 'Footer' }

export const DT_NEWSLETTER_COLUMN = [
    { accessorKey: 'email', header: 'Email', Cell: ({ renderedCellValue }) => <span className="font-medium">{renderedCellValue}</span> },
    { accessorKey: 'name', header: 'Name', Cell: ({ renderedCellValue }) => isEmpty(renderedCellValue) ? <Empty /> : <span>{renderedCellValue}</span> },
    {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ renderedCellValue }) => renderedCellValue === 'subscribed' ? <Pill tone="forest">Subscribed</Pill> : <Pill tone="danger">Unsubscribed</Pill>,
    },
    { accessorKey: 'source', header: 'Source', Cell: ({ renderedCellValue }) => <Pill tone="pine" dot={false}>{NEWSLETTER_SOURCE_LABEL[renderedCellValue] || renderedCellValue || 'Unknown'}</Pill> },
    { accessorKey: 'couponCode', header: 'Welcome Code', Cell: ({ renderedCellValue }) => <Mono value={renderedCellValue} /> },
    { accessorKey: 'pagePath', header: 'Signed Up On', Cell: ({ renderedCellValue }) => <Truncate value={renderedCellValue} width="max-w-[180px]" muted /> },
]

export const DT_ORDER_COLUMN = [
    { accessorKey: 'order_id', header: 'Order', Cell: ({ renderedCellValue }) => <span className="font-mono text-xs font-semibold">{renderedCellValue}</span> },
    { accessorKey: 'name', header: 'Customer', Cell: ({ row }) => <Person name={row.original.name} sub={row.original.email} /> },
    { accessorKey: 'email', header: 'Email', hidden: true, Cell: ({ renderedCellValue }) => <Truncate value={renderedCellValue} /> },
    { accessorKey: 'phone', header: 'Phone', Cell: ({ renderedCellValue }) => isEmpty(renderedCellValue) ? <Empty /> : <span className="tabular-nums">{renderedCellValue}</span> },
    {
        accessorKey: 'city',
        header: 'Ship To',
        Cell: ({ row }) => {
            const { city, state, pincode } = row.original
            if (!city && !state) return <Empty />
            return (
                <span className="flex flex-col leading-tight">
                    <span className="capitalize">{[city, state].filter(Boolean).join(', ')}</span>
                    {pincode && <span className="text-xs tabular-nums text-muted-foreground">{pincode}</span>}
                </span>
            )
        },
    },
    { accessorKey: 'state', header: 'State', hidden: true },
    { accessorKey: 'pincode', header: 'Pincode', hidden: true },
    { accessorKey: 'country', header: 'Country', hidden: true },
    { accessorKey: 'address', header: 'Address', hidden: true, Cell: ({ renderedCellValue }) => <Truncate value={renderedCellValue} muted /> },
    { accessorKey: 'landmark', header: 'Landmark', hidden: true, Cell: ({ renderedCellValue }) => <Truncate value={renderedCellValue} muted /> },
    {
        accessorKey: 'totalItem',
        header: 'Items',
        Cell: ({ row }) => {
            const products = row?.original?.products || []
            const units = products.reduce((sum, p) => sum + (Number(p.qty) || 0), 0)
            return (
                <span className="flex flex-col leading-tight" title={products.map((p) => `${p.qty} × ${p.name}`).join('\n')}>
                    <span className="tabular-nums">{units} {units === 1 ? 'unit' : 'units'}</span>
                    <span className="text-xs text-muted-foreground">{products.length} {products.length === 1 ? 'product' : 'products'}</span>
                </span>
            )
        },
    },
    { accessorKey: 'subtotal', header: 'Subtotal', hidden: true, Cell: ({ renderedCellValue }) => <Money value={renderedCellValue} /> },
    {
        accessorKey: 'couponDiscountAmount',
        header: 'Coupon',
        hidden: true,
        Cell: ({ renderedCellValue }) => Number(renderedCellValue) > 0 ? <span className="text-[var(--success)]">−<Money value={renderedCellValue} /></span> : <Empty />,
    },
    { accessorKey: 'totalAmount', header: 'Total', Cell: ({ renderedCellValue }) => <Money value={renderedCellValue} strong /> },
    {
        accessorKey: 'paymentStatus',
        header: 'Payment',
        Cell: ({ row }) => {
            const { paymentStatus, paymentMethod } = row.original
            return (
                <span className="flex flex-col items-start gap-1 leading-tight">
                    <Pill tone={PAYMENT_TONE[paymentStatus] || 'pine'}>{PAYMENT_LABEL[paymentStatus] || paymentStatus || 'Unknown'}</Pill>
                    <span className="text-xs text-muted-foreground">{METHOD_LABEL[paymentMethod] || paymentMethod || ''}</span>
                </span>
            )
        },
    },
    { accessorKey: 'payment_id', header: 'Payment Id', hidden: true, Cell: ({ renderedCellValue }) => <Mono value={renderedCellValue} /> },
    { accessorKey: 'status', header: 'Status', Cell: ({ renderedCellValue }) => <OrderStatus value={renderedCellValue} /> },
]
