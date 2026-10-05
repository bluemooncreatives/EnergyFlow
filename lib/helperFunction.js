
import { NextResponse } from "next/server"

export const response = (success, statusCode, message, data = {}, responseInit = {}) => {
    return NextResponse.json({
        success, statusCode, message, data
    }, responseInit)
}

export const catchError = (error, customMessage) => {
    // handling duplicate key error 
    if (error.code === 11000) {
        const keys = Object.keys(error.keyPattern).join(',')
        error.message = `Duplicate fields: ${keys}. These fields value must be unique.`
    }


    let errorObj = {}

    if (process.env.NODE_ENV === 'development') {
        errorObj = {
            message: error.message,
            error
        }
    } else {
        errorObj = {
            message: customMessage || 'Internal server error.',
        }
    }

    return NextResponse.json({
        success: false,
        statusCode: error.code,
        ...errorObj
    })

}

export const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    return otp
}

// Escape user-supplied text before it is fed into a MongoDB $regex.
// Raw input containing characters like ( [ \ * + ? would otherwise build an
// invalid (or catastrophically backtracking) regex — throwing a server error
// that breaks the whole query, or opening a ReDoS vector.
export const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')


// Date + time on two lines for admin tables; "—" for a missing date.
const formatTableDate = (value) => {
    const d = value ? new Date(value) : null
    if (!d || Number.isNaN(d.getTime())) return <span className="text-muted-foreground/60">-</span>
    return (
        <time dateTime={d.toISOString()} className="flex flex-col leading-tight">
            <span>{d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            <span className="text-xs text-muted-foreground">{d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</span>
        </time>
    )
}

export const columnConfig = (column, isCreatedAt = false, isUpdatedAt = false, isDeletedAt = false) => {
    const newColumn = [...column]

    if (isCreatedAt) {
        newColumn.push({
            accessorKey: 'createdAt',
            header: 'Created At',
            Cell: ({ renderedCellValue }) => formatTableDate(renderedCellValue)
        })
    }
    if (isUpdatedAt) {
        newColumn.push({
            accessorKey: 'updatedAt',
            header: 'Updated At',
            Cell: ({ renderedCellValue }) => formatTableDate(renderedCellValue)
        })
    }
    if (isDeletedAt) {
        newColumn.push({
            accessorKey: 'deletedAt',
            header: 'Deleted At',
            Cell: ({ renderedCellValue }) => formatTableDate(renderedCellValue)
        })
    }

    return newColumn
}

export const statusBadge = (status) => {
    const statusColorConfig = {
        pending: 'bg-blue-500',
        processing: 'bg-yellow-500',
        shipped: 'bg-cyan-500',
        delivered: 'bg-green-500',
        cancelled: 'bg-red-500',
        unverified: 'bg-orange-500',
    }
    return <span className={`${statusColorConfig[status]} capitalize px-3 py-1 rounded-full text-xs`}>{status}</span>
}
