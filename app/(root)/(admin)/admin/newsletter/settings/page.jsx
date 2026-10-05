'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import axios from 'axios'
import dayjs from 'dayjs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertTriangle,
  ExternalLink,
  ImagePlus,
  RotateCcw,
  Save,
  Trash2,
  Users,
} from 'lucide-react'

import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import PageHeader from '@/components/Application/Admin/PageHeader'
import ButtonLoading from '@/components/Application/ButtonLoading'
import MediaModal from '@/components/Application/Admin/MediaModal'
import Select from '@/components/Application/Select'
import NewsletterPreview from '@/components/Application/Admin/newsletter/NewsletterPreview'
import {
  AreaField,
  ChoiceField,
  FieldGroup,
  PerksField,
  SwitchField,
  TextField,
} from '@/components/Application/Admin/newsletter/SettingsFields'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import useFetch from '@/hooks/useFetch'
import { DEFAULT_NEWSLETTER_SETTINGS, newsletterSettingsSchema } from '@/lib/newsletterConfig'
import { showToast } from '@/lib/showToast'
import { cn } from '@/lib/utils'
import {
  ADMIN_COUPON_ADD,
  ADMIN_DASHBOARD,
  ADMIN_NEWSLETTER_SETTINGS,
  ADMIN_NEWSLETTER_SHOW,
} from '@/routes/AdminPanelRoute'

const breadcrumbData = [
  { href: ADMIN_DASHBOARD, label: 'Home' },
  { href: ADMIN_NEWSLETTER_SHOW, label: 'Newsletter' },
  { href: ADMIN_NEWSLETTER_SETTINGS, label: 'Customise' },
]

/* ── Visual swatches for the choice pickers ─────────────────────── */

const LayoutThumb = ({ kind }) => (
  <span className="relative flex h-16 items-center justify-center overflow-hidden rounded-md bg-muted">
    {kind === 'split' && (
      <span className="flex h-11 w-20 overflow-hidden rounded bg-[var(--palette-pine)] shadow">
        <span className="w-[42%] bg-[var(--palette-sunflower)]/70" />
        <span className="flex flex-1 flex-col justify-center gap-1 px-1.5">
          <span className="h-1 w-8 rounded bg-white/80" />
          <span className="h-1 w-6 rounded bg-white/40" />
          <span className="mt-0.5 h-1.5 w-9 rounded bg-[var(--palette-sunflower)]" />
        </span>
      </span>
    )}
    {kind === 'centered' && (
      <span className="relative mt-3 flex h-10 w-14 flex-col items-center justify-center gap-1 rounded bg-[var(--palette-pine)] shadow">
        <span className="absolute -top-3 size-5 rounded-full border-2 border-[var(--palette-sunflower)] bg-[#041C15]" />
        <span className="mt-2 h-1 w-8 rounded bg-white/80" />
        <span className="h-1.5 w-9 rounded bg-[var(--palette-sunflower)]" />
      </span>
    )}
    {kind === 'slide-in' && (
      <span className="absolute bottom-1.5 left-1.5 flex h-8 w-11 flex-col justify-center gap-1 rounded bg-[var(--palette-pine)] px-1.5 shadow">
        <span className="h-1 w-6 rounded bg-white/80" />
        <span className="h-1.5 w-8 rounded bg-[var(--palette-sunflower)]" />
      </span>
    )}
  </span>
)

const ThemeThumb = ({ bg, ink, accent }) => (
  <span className="flex h-12 items-center gap-1.5 rounded-md border px-2.5" style={{ background: bg }}>
    <span className="h-2 w-8 rounded" style={{ background: ink }} />
    <span className="h-2 w-5 rounded" style={{ background: accent }} />
    <span className="ml-auto h-5 w-7 rounded" style={{ background: accent }} />
  </span>
)

const LAYOUT_OPTIONS = [
  { value: 'split', label: 'Split with image', description: 'Photo or art panel beside the form. Most visual.', visual: <LayoutThumb kind="split" /> },
  { value: 'centered', label: 'Centred seal', description: 'Compact card crowned by the offer seal.', visual: <LayoutThumb kind="centered" /> },
  { value: 'slide-in', label: 'Slide-in corner', description: 'Small card, page stays usable. Least intrusive.', visual: <LayoutThumb kind="slide-in" /> },
]

const THEME_OPTIONS = [
  { value: 'pine', label: 'Pine', description: 'Deep green, sunflower accents.', visual: <ThemeThumb bg="#0B3D2E" ink="#F7F3E8" accent="#F2C94C" /> },
  { value: 'sun', label: 'Sunflower', description: 'Bright and warm, pine accents.', visual: <ThemeThumb bg="#F2C94C" ink="#0B3D2E" accent="#0B3D2E" /> },
  { value: 'cream', label: 'Cream', description: 'Light; follows dark mode.', visual: <ThemeThumb bg="#FDFBF6" ink="#0B3D2E" accent="#2F6B3F" /> },
]

/* ── Error → tab routing ────────────────────────────────────────── */

const TABS = [
  { value: 'content', label: 'Popup content' },
  { value: 'design', label: 'Design' },
  { value: 'offer', label: 'Offer & teaser' },
  { value: 'targeting', label: 'When & where' },
  { value: 'band', label: 'Band & footer' },
  { value: 'emails', label: 'Emails' },
]

// Dot paths of every field error, in form order ("popup.offer.couponCode").
const errorPaths = (errors, prefix = '') =>
  Object.entries(errors || {}).flatMap(([key, value]) => {
    if (!value || typeof value !== 'object') return []
    const path = prefix ? `${prefix}.${key}` : key
    return typeof value.message === 'string' ? [path] : errorPaths(value, path)
  })

const firstErrorPath = (errors) => errorPaths(errors)[0] || null

const TabLabel = ({ value, hasError, children }) => (
  <TabsTrigger value={value} className="relative flex-none px-3">
    {children}
    {hasError && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-destructive" aria-label="has errors" />}
  </TabsTrigger>
)

const tabForPath = (path = '') => {
  if (/^popup\.(layout|theme|imagePosition|image)/.test(path)) return 'design'
  if (/^popup\.(offer|teaser)/.test(path)) return 'offer'
  if (path.startsWith('popup')) return 'content'
  if (path.startsWith('behavior')) return 'targeting'
  if (path.startsWith('section') || path.startsWith('footer')) return 'band'
  if (path.startsWith('emails')) return 'emails'
  return 'content'
}

// Plain-English summary of when the popup appears.
const describeBehavior = (behavior, popupEnabled) => {
  if (!popupEnabled) return 'The popup is switched off. The homepage band and footer form still work.'
  const delay = Number(behavior.delaySeconds) || 0
  const scroll = Number(behavior.scrollPercent) || 0
  const triggers = []
  if (delay > 0) triggers.push(`after ${delay}s on a page`)
  if (scroll > 0) triggers.push(`when a visitor scrolls ${scroll}% down`)
  if (behavior.exitIntent) triggers.push('when a desktop visitor moves to leave')
  const when = triggers.length ? triggers.join(', or ') : 'about a second after the page loads'
  const where = behavior.pages === 'home' ? 'on the homepage only' : 'on every storefront page'
  const excluded = behavior.excludePaths?.filter(Boolean).length ? ` except ${behavior.excludePaths.filter(Boolean).join(', ')}` : ''
  const devices = behavior.showOnDesktop && behavior.showOnMobile
    ? 'desktop and mobile'
    : behavior.showOnDesktop ? 'desktop only' : behavior.showOnMobile ? 'mobile only' : 'no devices'
  const again = Number(behavior.dismissDays) > 0
    ? `Once closed, it stays hidden for ${behavior.dismissDays} day${Number(behavior.dismissDays) === 1 ? '' : 's'}`
    : 'Once closed, it can reappear on the next visit'
  return `Opens ${when} - ${where}${excluded}, on ${devices}. ${again}; subscribers never see it again.`
}

const NewsletterSettingsPage = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('content')
  const [updatedAt, setUpdatedAt] = useState(null)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState([])

  const form = useForm({
    resolver: zodResolver(newsletterSettingsSchema),
    defaultValues: DEFAULT_NEWSLETTER_SETTINGS,
    mode: 'onChange',
  })
  const { control, formState } = form
  const values = form.watch()

  // Load saved settings.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await axios.get('/api/newsletter/settings')
        if (!data.success) throw new Error(data.message)
        if (cancelled) return
        form.reset(data.data.settings)
        setUpdatedAt(data.data.updatedAt)
      } catch (error) {
        showToast('error', error.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!formState.isDirty) return
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [formState.isDirty])

  // Coupons for the welcome offer.
  const { data: couponData } = useFetch('/api/coupon?deleteType=SD&size=1000')
  const coupons = useMemo(() => couponData?.data || [], [couponData])
  const couponOptions = useMemo(
    () => coupons.map((c) => {
      const expired = dayjs(c.validity).isBefore(dayjs())
      return {
        value: c.code,
        label: `${c.code} - ${c.discountPercentage}% off${c.minShoppingAmount ? ` over ₹${c.minShoppingAmount}` : ''} · ${expired ? 'EXPIRED' : `till ${dayjs(c.validity).format('DD MMM YYYY')}`}`,
      }
    }),
    [coupons]
  )
  const selectedCoupon = coupons.find((c) => c.code === values.popup?.offer?.couponCode)
  const couponExpired = selectedCoupon ? dayjs(selectedCoupon.validity).isBefore(dayjs()) : false
  const offerLive = Boolean(values.popup?.offer?.enabled && selectedCoupon && !couponExpired)

  // Media picker → image field.
  useEffect(() => {
    if (!mediaOpen && selectedMedia.length > 0) {
      const media = selectedMedia[0]
      if (media?.url && media.url !== form.getValues('popup.image.url')) {
        form.setValue('popup.image.url', media.url, { shouldDirty: true, shouldValidate: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaOpen, selectedMedia])

  const onCouponChange = (code) => {
    form.setValue('popup.offer.couponCode', code || '', { shouldDirty: true, shouldValidate: true })
    const coupon = coupons.find((c) => c.code === code)
    const badge = form.getValues('popup.offer.badge')
    // Suggest the badge from the coupon unless the admin wrote their own.
    if (coupon && (!badge || /%\s*OFF$/i.test(badge))) {
      form.setValue('popup.offer.badge', `${coupon.discountPercentage}% OFF`, { shouldDirty: true, shouldValidate: true })
    }
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const { data: res } = await axios.put('/api/newsletter/settings', data)
      if (!res.success) throw new Error(res.message)
      form.reset(data)
      setUpdatedAt(res.data?.updatedAt || new Date().toISOString())
      showToast('success', res.message)
    } catch (error) {
      showToast('error', error.message)
    } finally {
      setSaving(false)
    }
  }

  const onInvalid = (errors) => {
    const path = firstErrorPath(errors)
    setTab(tabForPath(path))
    showToast('error', 'Please fix the highlighted fields.')
  }

  const resetDefaults = () => {
    form.reset(DEFAULT_NEWSLETTER_SETTINGS, { keepDefaultValues: true })
    setSelectedMedia([])
    showToast('success', 'Defaults restored - save to publish them.')
  }

  // Tabs holding at least one invalid field get a red dot.
  const errorTabs = new Set(errorPaths(formState.errors).map(tabForPath))

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        title="Popup & sign-up forms"
        description="Design the newsletter popup, the homepage newsletter band and the footer sign-up - changes go live when you save."
        breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
        actions={
          <>
            <Button asChild variant="outline" className="h-9">
              <Link href={ADMIN_NEWSLETTER_SHOW}><Users className="size-4" /> Subscribers</Link>
            </Button>
            <Button asChild variant="outline" className="h-9" title="Opens the storefront with the popup forced open (last saved version)">
              <a href="/?newsletter=preview" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" /> Preview on site
              </a>
            </Button>
          </>
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="flex flex-col gap-4 sm:gap-6">
          {/* Sticky save bar */}
          <div className="sticky top-[4.5rem] z-20 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card/95 px-4 py-3 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 text-sm">
              {formState.isDirty ? (
                <span className="ef-tone--sun rounded-full border px-2.5 py-0.5 text-xs font-medium">Unsaved changes</span>
              ) : (
                <span className="ef-tone--forest rounded-full border px-2.5 py-0.5 text-xs font-medium">All changes saved</span>
              )}
              <span className="hidden text-muted-foreground sm:inline">
                {updatedAt ? `Last published ${dayjs(updatedAt).format('DD MMM YYYY, hh:mm A')}` : 'Using the default design'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" className="h-9" onClick={resetDefaults} disabled={loading || saving}>
                <RotateCcw className="size-4" /> Reset to defaults
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9"
                disabled={!formState.isDirty || saving}
                onClick={() => form.reset()}
              >
                Discard
              </Button>
              <ButtonLoading
                type="submit"
                loading={saving}
                disabled={loading || saving}
                className="h-9"
                text={<span className="inline-flex items-center gap-2"><Save className="size-4" /> Save & publish</span>}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            {/* ─────────────── Settings ─────────────── */}
            <Tabs value={tab} onValueChange={setTab} className={cn('min-w-0 gap-4', loading && 'pointer-events-none opacity-60')}>
              <div className="overflow-x-auto no-scrollbar">
                <TabsList className="h-9">
                  {TABS.map(({ value, label }) => (
                    <TabLabel key={value} value={value} hasError={errorTabs.has(value)}>{label}</TabLabel>
                  ))}
                </TabsList>
              </div>

              {/* Popup content */}
              <TabsContent value="content" className="flex flex-col gap-4">
                <FieldGroup title="Popup" description="The popup that greets new visitors.">
                  <SwitchField control={control} name="popup.enabled" label="Show the popup on the storefront" description="Turn off to keep only the homepage band and footer form." />
                </FieldGroup>

                <FieldGroup title="Headline & copy">
                  <TextField control={control} name="popup.eyebrow" label="Eyebrow" placeholder="The Energyflow club" maxLength={40} hint="The small pill above the headline. Leave empty to hide." />
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <TextField control={control} name="popup.title" label="Headline" placeholder="Fresh drops," maxLength={40} />
                    <TextField control={control} name="popup.titleAccent" label="Accent words" placeholder="first dibs" maxLength={40} hint="Shown in the accent colour with a hand-drawn underline." />
                  </div>
                  <AreaField control={control} name="popup.description" label="Description" maxLength={240} />
                  <PerksField control={control} name="popup.perks" />
                </FieldGroup>

                <FieldGroup title="Form">
                  <SwitchField control={control} name="popup.collectName" label="Ask for first name" description="Adds an optional name field for personalised emails." />
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <TextField control={control} name="popup.placeholder" label="Email placeholder" maxLength={60} />
                    <TextField control={control} name="popup.buttonText" label="Button text" maxLength={28} />
                  </div>
                  <TextField control={control} name="popup.declineText" label="Decline link" placeholder="Maybe later" maxLength={50} hint="A soft 'no thanks' link under the form. Leave empty to hide." />
                  <AreaField control={control} name="popup.consentText" label="Consent / fine print" maxLength={220} rows={2} />
                </FieldGroup>

                <FieldGroup title="After sign-up" description="Shown in place of the form, with confetti and the welcome code when an offer is live.">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <TextField control={control} name="popup.successTitle" label="Success title" maxLength={40} />
                    <TextField control={control} name="popup.successButtonText" label="Success button" maxLength={28} hint="Links to the shop." />
                  </div>
                  <AreaField control={control} name="popup.successMessage" label="Success message" maxLength={220} rows={2} />
                </FieldGroup>
              </TabsContent>

              {/* Design */}
              <TabsContent value="design" className="flex flex-col gap-4">
                <FieldGroup title="Layout" description="On phones every layout becomes a bottom sheet (slide-in stays a compact card).">
                  <ChoiceField control={control} name="popup.layout" options={LAYOUT_OPTIONS} />
                </FieldGroup>

                <FieldGroup title="Colour theme" description="Built from the storefront palette.">
                  <ChoiceField control={control} name="popup.theme" options={THEME_OPTIONS} />
                </FieldGroup>

                <FieldGroup
                  title="Image"
                  description={values.popup?.layout === 'split'
                    ? 'Shown beside the form on desktop and as a banner on mobile. Without one, an illustrated panel is used.'
                    : 'Only the split layout shows an image.'}
                >
                  <div className={cn('flex flex-col gap-4', values.popup?.layout !== 'split' && 'pointer-events-none opacity-50')}>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="relative flex h-28 w-44 items-center justify-center overflow-hidden rounded-md border bg-muted">
                        {values.popup?.image?.url ? (
                          <Image src={values.popup.image.url} alt="" fill sizes="176px" className="object-cover" />
                        ) : (
                          <span className="px-3 text-center text-xs text-muted-foreground">Illustrated panel (no image)</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button type="button" variant="outline" className="h-9" onClick={() => setMediaOpen(true)}>
                          <ImagePlus className="size-4" /> {values.popup?.image?.url ? 'Change image' : 'Choose from media'}
                        </Button>
                        {values.popup?.image?.url && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-9 text-destructive hover:text-destructive/80"
                            onClick={() => {
                              form.setValue('popup.image.url', '', { shouldDirty: true })
                              setSelectedMedia([])
                            }}
                          >
                            <Trash2 className="size-4" /> Remove image
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground">Portrait photos work best (about 4:5).</p>
                      </div>
                    </div>
                    <TextField control={control} name="popup.image.alt" label="Image alt text" placeholder="Bowl of almonds and cashews" maxLength={140} hint="Describe the photo for screen readers." />
                    <ChoiceField
                      control={control}
                      name="popup.imagePosition"
                      label="Image side (desktop)"
                      columns={2}
                      options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]}
                    />
                  </div>
                </FieldGroup>
                <MediaModal
                  open={mediaOpen}
                  setOpen={setMediaOpen}
                  selectedMedia={selectedMedia}
                  setSelectedMedia={setSelectedMedia}
                  isMultiple={false}
                />
              </TabsContent>

              {/* Offer & teaser */}
              <TabsContent value="offer" className="flex flex-col gap-4">
                <FieldGroup
                  title="Welcome offer"
                  description="Reward sign-ups with a coupon. The code is revealed only after someone subscribes, and emailed to them."
                >
                  <SwitchField control={control} name="popup.offer.enabled" label="Give a welcome coupon" description="Adds the offer seal, the code reveal and the code in the welcome email." />
                  <FormField
                    control={control}
                    name="popup.offer.couponCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coupon</FormLabel>
                        <FormControl>
                          <Select
                            options={couponOptions}
                            selected={field.value || null}
                            setSelected={onCouponChange}
                            placeholder={couponOptions.length ? 'Choose a coupon' : 'No coupons yet'}
                          />
                        </FormControl>
                        <FormDescription>
                          Pick an existing coupon, or{' '}
                          <Link href={ADMIN_COUPON_ADD} className="underline underline-offset-2" target="_blank">create one</Link>{' '}
                          (e.g. WELCOME10) first.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {values.popup?.offer?.enabled && values.popup?.offer?.couponCode && (!selectedCoupon || couponExpired) && (
                    <p className="ef-tone--danger flex items-start gap-2 rounded-md border p-3 text-sm">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                      {couponExpired
                        ? 'This coupon has expired. Extend its validity or pick another - an expired offer is hidden from the storefront.'
                        : 'This coupon no longer exists. Pick another one.'}
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <TextField control={control} name="popup.offer.badge" label="Badge text" placeholder="10% OFF" maxLength={14} hint="Inside the rotating seal. Two words stack best." />
                    <TextField control={control} name="popup.offer.note" label="Offer note" placeholder="On your first order." maxLength={90} />
                  </div>
                </FieldGroup>

                <FieldGroup title="Teaser" description="After someone closes the popup, a small pill stays in the corner so they can reopen it.">
                  <SwitchField control={control} name="popup.teaser.enabled" label="Show the teaser pill" />
                  <TextField control={control} name="popup.teaser.text" label="Teaser text" placeholder="Get 10% off" maxLength={28} />
                </FieldGroup>
              </TabsContent>

              {/* When & where */}
              <TabsContent value="targeting" className="flex flex-col gap-4">
                <div className="ef-tone--pine rounded-md border p-4 text-sm leading-relaxed">
                  {describeBehavior(values.behavior || {}, values.popup?.enabled)}
                </div>

                <FieldGroup title="Triggers" description="The popup opens on whichever enabled trigger happens first.">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <TextField control={control} name="behavior.delaySeconds" type="number" label="Time on page (seconds)" hint="0 turns the timer off. Desktop only: on phones the popup waits for scroll depth (50% if none is set), so it never covers a page while it loads." />
                    <TextField control={control} name="behavior.scrollPercent" type="number" label="Scroll depth (%)" hint="0 turns scroll tracking off." />
                  </div>
                  <SwitchField control={control} name="behavior.exitIntent" label="Exit intent (desktop)" description="Opens when the cursor heads for the tabs or close button." />
                </FieldGroup>

                <FieldGroup title="Frequency">
                  <TextField
                    control={control}
                    name="behavior.dismissDays"
                    type="number"
                    label="Hide for (days) after it's closed"
                    hint="Industry standard is 7-30 days. Subscribers never see the popup again."
                  />
                </FieldGroup>

                <FieldGroup title="Pages & devices">
                  <ChoiceField
                    control={control}
                    name="behavior.pages"
                    label="Show on"
                    columns={2}
                    options={[
                      { value: 'all', label: 'All storefront pages' },
                      { value: 'home', label: 'Homepage only' },
                    ]}
                  />
                  <FormField
                    control={control}
                    name="behavior.excludePaths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Never show on</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            className="font-mono text-xs"
                            placeholder={'/cart\n/checkout'}
                            value={(field.value || []).join('\n')}
                            onChange={(e) => field.onChange(e.target.value.split('\n'))}
                          />
                        </FormControl>
                        <FormDescription>One path per line. Covers sub-pages too (/checkout also hides it on /checkout/…).</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <SwitchField control={control} name="behavior.showOnDesktop" label="Desktop & tablet" />
                    <SwitchField control={control} name="behavior.showOnMobile" label="Mobile" />
                  </div>
                </FieldGroup>
              </TabsContent>

              {/* Band & footer */}
              <TabsContent value="band" className="flex flex-col gap-4">
                <FieldGroup title="Homepage newsletter band" description="A full-width band on the homepage, just above the FAQ.">
                  <SwitchField control={control} name="section.enabled" label="Show the band on the homepage" />
                  <ChoiceField control={control} name="section.theme" label="Colour theme" options={THEME_OPTIONS} />
                  <TextField control={control} name="section.eyebrow" label="Eyebrow" maxLength={40} />
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <TextField control={control} name="section.title" label="Headline" maxLength={40} />
                    <TextField control={control} name="section.titleAccent" label="Accent words" maxLength={40} />
                  </div>
                  <AreaField control={control} name="section.description" label="Description" maxLength={240} />
                  <PerksField control={control} name="section.perks" label="Perk chips" />
                  <SwitchField control={control} name="section.showOffer" label="Show the welcome-offer seal" description="Only while the popup's welcome coupon is live." />
                  <SwitchField control={control} name="section.collectName" label="Ask for first name" />
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <TextField control={control} name="section.placeholder" label="Email placeholder" maxLength={60} />
                    <TextField control={control} name="section.buttonText" label="Button text" maxLength={28} />
                  </div>
                  <AreaField control={control} name="section.consentText" label="Fine print" maxLength={220} rows={2} />
                  <AreaField control={control} name="section.successMessage" label="Success message" maxLength={220} rows={2} />
                </FieldGroup>

                <FieldGroup title="Footer sign-up" description="A compact form in the site footer, on every storefront page.">
                  <SwitchField control={control} name="footer.enabled" label="Show the footer form" />
                  <TextField control={control} name="footer.title" label="Title" maxLength={40} />
                  <TextField control={control} name="footer.description" label="Description" maxLength={140} />
                  <TextField control={control} name="footer.buttonText" label="Button text" maxLength={28} />
                </FieldGroup>
              </TabsContent>

              {/* Emails */}
              <TabsContent value="emails" className="flex flex-col gap-4">
                <FieldGroup title="Welcome email" description="Sent once to each new subscriber, with the welcome code when an offer is live and a one-click unsubscribe link.">
                  <SwitchField control={control} name="emails.welcomeEnabled" label="Send a welcome email" />
                  <TextField control={control} name="emails.welcomeSubject" label="Subject line" maxLength={120} />
                </FieldGroup>
                <FieldGroup title="Store notifications">
                  <SwitchField control={control} name="emails.notifyAdmin" label="Email the store inbox for each new subscriber" description="Goes to the address the site sends mail from." />
                </FieldGroup>
              </TabsContent>
            </Tabs>

            {/* ─────────────── Live preview ─────────────── */}
            <div className="min-w-0 xl:sticky xl:top-[9rem]">
              <section className="rounded-md bg-card p-4 sm:p-6">
                <h3 className="mb-4 text-sm font-semibold">Live preview</h3>
                {values.popup && values.section && values.footer && (
                  <NewsletterPreview values={values} offerLive={offerLive} />
                )}
              </section>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default NewsletterSettingsPage
