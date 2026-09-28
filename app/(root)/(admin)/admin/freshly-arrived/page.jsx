'use client'

import { Sparkles } from 'lucide-react'
import CuratedProductsManager from '@/components/Application/Admin/curation/CuratedProductsManager'
import { ADMIN_FRESHLY_ARRIVED_SHOW } from '@/routes/AdminPanelRoute'

// The homepage Freshly Arrived grid always shows exactly 9 (productService
// tops a short list up with the newest products).
const CONFIG = {
  title: 'Freshly Arrived',
  noun: 'freshly arrived pick',
  description: 'Curate the products shown in the storefront Freshly Arrived section.',
  icon: Sparkles,
  endpoint: '/api/freshly-arrived',
  slots: 9,
  exact: true,
  breadcrumbHref: ADMIN_FRESHLY_ARRIVED_SHOW,
}

const ShowFreshlyArrived = () => <CuratedProductsManager config={CONFIG} />

export default ShowFreshlyArrived
