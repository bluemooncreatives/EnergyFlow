import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { buildCatalogPipeline, catalogResult, parseCatalogParams } from '@/lib/adminCatalogQuery.mjs'
import { NextResponse } from 'next/server'

export async function getAdminCatalog(request, model, kind, { exportRows = false } = {}) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.', {}, { status: 403 })
        const query = parseCatalogParams(request.nextUrl.searchParams, kind)
        await connectDB()
        const results = await model.aggregate(buildCatalogPipeline(kind, query, { exportRows }))
        return NextResponse.json(exportRows
            ? { success: true, data: results }
            : catalogResult(kind, results[0]))
    } catch (error) {
        if (error.status === 400) return NextResponse.json({ success: false, message: error.message }, { status: 400 })
        return catchError(error)
    }
}
