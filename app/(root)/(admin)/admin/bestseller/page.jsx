'use client'

import { Crown } from 'lucide-react'
import CuratedProductsManager from '@/components/Application/Admin/curation/CuratedProductsManager'
import { ADMIN_BESTSELLER_SHOW } from '@/routes/AdminPanelRoute'

// The storefront Bestsellers carousel shows the first 12 (productService).
const CONFIG = {
  title: 'Bestsellers',
  noun: 'bestseller',
  description: 'Curate the products shown in the storefront Bestsellers carousel.',
  icon: Crown,
  endpoint: '/api/bestseller',
  slots: 12,
  exact: false,
  breadcrumbHref: ADMIN_BESTSELLER_SHOW,
}

const ShowBestsellers = () => <CuratedProductsManager config={CONFIG} />

export default ShowBestsellers
