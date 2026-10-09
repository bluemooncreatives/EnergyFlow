import ProductVariantModel from '@/models/ProductVariant.model'
import { getAdminCatalog } from '@/lib/services/adminCatalogService'

export async function GET(request) {
    return getAdminCatalog(request, ProductVariantModel, 'variant', { exportRows: true })
}
