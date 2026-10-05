'use client'

import { Sparkles } from 'lucide-react'
import CuratedProductsManager from '@/components/Application/Admin/curation/CuratedProductsManager'
import { ADMIN_FRESHLY_ARRIVED_SHOW } from '@/routes/AdminPanelRoute'

// These picks fill the homepage "Popular right now" grid, which always shows
// exactly 10 — a 2 x 5 block (FRESHLY_ARRIVED_COUNT in productService, which
// tops a short list up with the newest products). Keep the two in step.
const CONFIG = {
  title: 'Freshly Arrived',
  noun: 'freshly arrived pick',
  description: 'Curate the products shown in the homepage Popular right now section.',
  icon: Sparkles,
  endpoint: '/api/freshly-arrived',
  slots: 10,
  exact: true,
  breadcrumbHref: ADMIN_FRESHLY_ARRIVED_SHOW,
}

const ShowFreshlyArrived = () => <CuratedProductsManager config={CONFIG} />

export default ShowFreshlyArrived
