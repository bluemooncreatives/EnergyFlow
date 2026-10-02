import { COMPANY } from '@/lib/company'

export const WHATSAPP_HREF = `https://wa.me/${COMPANY.phoneHref.replace(/\D/g, '')}?text=${encodeURIComponent('Hi Energyflow, I would like to enquire about corporate gift boxes.')}`

export const pad = (n) => String(n).padStart(2, '0')

export const priceOf = (product) => product?.defaultVariant?.sellingPrice ?? product?.sellingPrice

export const photoOf = (product) => product?.media?.find((m) => m?.secure_url)?.secure_url || null
