import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import dayjs from "dayjs"
import userIcon from '@/public/assets/images/user.png'
export const DT_CATEGORY_COLUMN = [
    {
        accessorKey: 'name',
        header: 'Category Name',
    },
    {
        accessorKey: 'slug',
        header: 'Slug',
    },
]

export const DT_PRODUCT_COLUMN = [
    {
        accessorKey: 'name',
        header: 'Product Name',
    },
    {
        accessorKey: 'slug',
        header: 'Slug',
    },
    {
        accessorKey: 'category',
        header: 'Category',
    },
    {
        accessorKey: 'mrp',
        header: 'MRP',
    },
    {
        accessorKey: 'sellingPrice',
        header: 'Selling Price',
    },
    {
        accessorKey: 'discountPercentage',
        header: 'Discount Percentage',
    },

]


export const DT_PRODUCT_VARIANT_COLUMN = [
    {
        accessorKey: 'product',
        header: 'Product Name',
    },
    {
        accessorKey: 'color',
        header: 'Color',
    },
    {
        accessorKey: 'size',
        header: 'Size',
    },
    {
        accessorKey: 'sku',
        header: 'SKU',
    },

    {
        accessorKey: 'mrp',
        header: 'MRP',
    },
    {
        accessorKey: 'sellingPrice',
        header: 'Selling Price',
    },
    {
        accessorKey: 'discountPercentage',
        header: 'Discount Percentage',
    },

]


export const DT_COUPON_COLUMN = [
    {
        accessorKey: 'code',
        header: 'Code',
    },


    {
        accessorKey: 'discountPercentage',
        header: 'Discount Percentage',
    },

    {
        accessorKey: 'minShoppingAmount',
        header: 'Min. Shopping Amount',
    },
    {
        accessorKey: 'validity',
        header: 'Validity',
        Cell: ({ renderedCellValue }) => (
            new Date() > new Date(renderedCellValue)
                ? <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300">{dayjs(renderedCellValue).format('DD/MM/YYYY')}</Badge>
                : <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300">{dayjs(renderedCellValue).format('DD/MM/YYYY')}</Badge>
        )
        ,
    },

]


export const DT_CUSTOMERS_COLUMN = [
    {
        accessorKey: 'avatar',
        header: 'Avatar',
        Cell: ({ renderedCellValue }) => (
            <Avatar>
                <AvatarImage src={renderedCellValue?.url || userIcon.src} />
            </Avatar>
        )
    },
    {
        accessorKey: 'name',
        header: 'Name',
    },
    {
        accessorKey: 'email',
        header: 'Email',
    },
    {
        accessorKey: 'phone',
        header: 'Phone',
    },
    {
        accessorKey: 'address',
        header: 'Address',
    },
    {
        accessorKey: 'isEmailVerified',
        header: 'Is Verified',
        Cell: ({ renderedCellValue }) => (
            renderedCellValue
                ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300">Verified</Badge>
                : <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300">Not Verified</Badge>
        )
    },


]

export const DT_REVIEW_COLUMN = [

    {
        accessorKey: 'product',
        header: 'Product',
    },

    {
        accessorKey: 'user',
        header: 'User',
    },

    {
        accessorKey: 'title',
        header: 'Title',
    },
    {
        accessorKey: 'rating',
        header: 'Rating',
    },
    {
        accessorKey: 'review',
        header: 'Review',
    },
]

export const DT_CONTACT_COLUMN = [
  {
    accessorKey: 'ticketId',
    header: 'Query ID',
    Cell: ({ renderedCellValue }) => (
      <span className="font-medium whitespace-nowrap">{renderedCellValue || '—'}</span>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'phone',
    header: 'Mobile',
    Cell: ({ renderedCellValue }) => <span>{renderedCellValue || '—'}</span>,
  },
  {
    accessorKey: 'address',
    header: 'Address',
    Cell: ({ renderedCellValue }) => (
      <span className="max-w-[200px] truncate block text-muted-foreground">{renderedCellValue || '—'}</span>
    ),
  },
  {
    accessorKey: 'subject',
    header: 'Subject',
    Cell: ({ renderedCellValue }) => (
      <span className="max-w-[200px] truncate block">{renderedCellValue || '—'}</span>
    ),
  },
  {
    accessorKey: 'message',
    header: 'Message',
    Cell: ({ renderedCellValue }) => (
      <span className="max-w-[260px] truncate block text-muted-foreground">
        {renderedCellValue?.length > 80 ? renderedCellValue.slice(0, 80) + '…' : renderedCellValue}
      </span>
    ),
  },
  {
    accessorKey: 'isRead',
    header: 'Status',
    Cell: ({ renderedCellValue }) =>
      renderedCellValue ? (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300">Read</Badge>
      ) : (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">New</Badge>
      ),
  },
]

export const DT_ORDER_COLUMN = [

    {
        accessorKey: 'order_id',
        header: 'Order Id',
    },
    {
        accessorKey: 'payment_id',
        header: 'Payment Id',
    },

    {
        accessorKey: 'name',
        header: 'Name',
    },
    {
        accessorKey: 'email',
        header: 'Email',
    },
    {
        accessorKey: 'phone',
        header: 'Phone',
    },
    {
        accessorKey: 'country',
        header: 'Country',
    },
    {
        accessorKey: 'state',
        header: 'State',
    },
    {
        accessorKey: 'city',
        header: 'City',
    },

    {
        accessorKey: 'pincode',
        header: 'Pincode',
    },
    {
        accessorKey: 'address',
        header: 'Address',
    },
    {
        accessorKey: 'landmark',
        header: 'Landmark',
    },
    {
        accessorKey: 'totalItem',
        header: 'Total Item',
        Cell: ({ row }) => (<span>{row?.original?.products?.length || 0}</span>)
    },
    {
        accessorKey: 'subtotal',
        header: 'Subtotal',
    },
    {
        accessorKey: 'discount',
        header: 'Discount',
        Cell: ({ renderedCellValue }) => (<span>{Math.round(renderedCellValue)}</span>)
    },
    {
        accessorKey: 'couponDiscount',
        header: 'Coupon Discount',
    },
    {
        accessorKey: 'totalAmount',
        header: 'Total Amount',
    },
    {
        accessorKey: 'status',
        header: 'Status',
    },
]

export const DT_SIZE_GUIDE_COLUMN = [
    {
        accessorKey: 'name',
        header: 'Name',
    },
    {
        accessorKey: 'slug',
        header: 'Slug',
    },
    {
        accessorKey: 'type',
        header: 'Type',
        Cell: ({ renderedCellValue }) => (
            <span className="capitalize">{String(renderedCellValue || '').replace(/-/g, ' ')}</span>
        )
    },
    {
        accessorKey: 'isActive',
        header: 'Status',
        Cell: ({ renderedCellValue }) => (
            renderedCellValue
                ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300">Active</Badge>
                : <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300">Inactive</Badge>
        )
    },
    {
        accessorKey: 'columns',
        header: 'Columns',
        Cell: ({ renderedCellValue }) => (
            <span>{Array.isArray(renderedCellValue) ? renderedCellValue.length : 0}</span>
        )
    },
    {
        accessorKey: 'rows',
        header: 'Rows',
        Cell: ({ renderedCellValue }) => (
            <span>{Array.isArray(renderedCellValue) ? renderedCellValue.length : 0}</span>
        )
    },
]