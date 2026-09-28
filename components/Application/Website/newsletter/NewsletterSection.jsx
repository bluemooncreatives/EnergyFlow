import { getPublicNewsletterSettings } from '@/lib/services/newsletterService'
import NewsletterSectionClient from './NewsletterSectionClient'

// Homepage newsletter band. Copy, theme and perks come from
// Admin → Newsletter → Customise; the offer seal shows only while the popup's
// welcome coupon is live. Renders nothing when the admin switches it off.
const NewsletterSection = async () => {
    let settings = null
    try {
        settings = await getPublicNewsletterSettings()
    } catch {
        // A transient DB error must not take down the homepage.
        return null
    }

    if (!settings?.section?.enabled) return null

    const offer = settings.section.showOffer && settings.popup.offer.enabled ? settings.popup.offer : null
    return <NewsletterSectionClient section={settings.section} offer={offer} />
}

export default NewsletterSection
