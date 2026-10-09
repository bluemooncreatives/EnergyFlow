import ProductModel from '@/models/Product.model'
import { getAdminCatalog } from '@/lib/services/adminCatalogService'

export async function GET(request) {
    return getAdminCatalog(request, ProductModel, 'product', { exportRows: true })
}
