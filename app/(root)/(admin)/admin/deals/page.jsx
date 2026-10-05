'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import axios from 'axios'
import dayjs from 'dayjs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, ArrowRight, BadgePercent, Clock3, ExternalLink, ImagePlus, RotateCcw, Save, Trash2 } from 'lucide-react'

import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import PageHeader from '@/components/Application/Admin/PageHeader'
import ButtonLoading from '@/components/Application/ButtonLoading'
import MediaModal from '@/components/Application/Admin/MediaModal'
import CuratedProductsManager from '@/components/Application/Admin/curation/CuratedProductsManager'
import { AreaField, ChoiceField, FieldGroup, SwitchField, TextField } from '@/components/Application/Admin/newsletter/SettingsFields'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DEAL_SLOTS,
  DEFAULT_DEAL_BANNER_IMAGE,
  DEFAULT_DEAL_SETTINGS,
  dealHasEnded,
  dealSettingsSchema,
} from '@/lib/dealsConfig'
import { showToast } from '@/lib/showToast'
import { cn } from '@/lib/utils'
import { ADMIN_DASHBOARD, ADMIN_DEALS_SHOW } from '@/routes/AdminPanelRoute'

const breadcrumbData = [
  { href: ADMIN_DASHBOARD, label: 'Home' },
  { href: ADMIN_DEALS_SHOW, label: 'Deals of the Month' },
]

// Products are saved by the curation manager on its own; this config only
// describes the rail to it.
const PRODUCTS_CONFIG = {
  title: 'Deals of the Month',
  noun: 'deal',
  icon: BadgePercent,
  endpoint: '/api/deals',
  slots: DEAL_SLOTS,
  exact: true,
  fillNoun: 'deepest discounts',
  embedded: true,
  breadcrumbHref: ADMIN_DEALS_SHOW,
}

const COUNTDOWN_OPTIONS = [
  { value: 'month-end', label: 'End of every month', description: 'Counts down to the 1st and restarts on its own.' },
  { value: 'custom', label: 'Custom end date', description: 'Counts down to a date you pick. The section hides when it ends.' },
  { value: 'off', label: 'No countdown', description: 'The deals stay up with no timer.' },
]

// The form edits the deadline as a local "YYYY-MM-DDTHH:mm" (what a
// datetime-local input speaks); the API stores an ISO timestamp.
const LOCAL_FORMAT = 'YYYY-MM-DDTHH:mm'
const toFormValues = (settings) => ({
  ...settings,
  countdown: {
    ...settings.countdown,
    endsAt: settings.countdown.endsAt ? dayjs(settings.countdown.endsAt).format(LOCAL_FORMAT) : '',
  },
})
const toPayload = (values) => ({
  ...values,
  countdown: {
    ...values.countdown,
    endsAt: values.countdown.mode === 'custom' && values.countdown.endsAt
      ? dayjs(values.countdown.endsAt).toISOString()
      : '',
  },
})

// What shoppers see right now, from the last published settings.
const describeLiveState = (settings) => {
  if (!settings) return null
  const { section, countdown } = settings
  if (!section.enabled) return { tone: 'muted', text: 'Switched off. The section is hidden from the homepage.' }
  if (dealHasEnded(countdown)) {
    return {
      tone: 'danger',
      text: `Ended ${dayjs(countdown.endsAt).format('DD MMM YYYY, hh:mm A')}. The section is hidden until you set a new end date.`,
    }
  }
  if (countdown.mode === 'custom') return { tone: 'live', text: `Live until ${dayjs(countdown.endsAt).format('DD MMM YYYY, hh:mm A')}.` }
  if (countdown.mode === 'month-end') return { tone: 'live', text: 'Live. The timer counts down to the end of each month.' }
  return { tone: 'live', text: 'Live, with no countdown.' }
}

const TONE_CLASS = {
  live: 'ef-tone--forest',
  muted: 'ef-tone--sun',
  danger: 'ef-tone--danger',
}

// A scaled-down copy of the storefront banner so edits can be judged in place.
const BannerPreview = ({ banner, countdown }) => (
  <div className="flex flex-col gap-3">
    <div className="relative flex min-h-[18rem] flex-col justify-between gap-6 overflow-hidden rounded-[var(--radius-card)] p-6 text-white">
      <Image
        src={banner.image?.url || DEFAULT_DEAL_BANNER_IMAGE}
        alt=""
        fill
        sizes="(max-width: 1280px) 90vw, 32rem"
        className="-z-10 object-cover"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(180deg, rgb(4 26 20 / 0.9) 0%, rgb(4 26 20 / 0.55) 42%, rgb(4 26 20 / 0.05) 75%)' }}
      />
      <span className="flex flex-col gap-2">
        <span className="text-2xl font-medium leading-[1.08] tracking-[-0.025em]">{banner.title || 'Banner title'}</span>
        {banner.copy && <span className="text-sm text-white/80">{banner.copy}</span>}
      </span>
      <span className="ef-btn ef-btn--accent ef-btn--sm self-start">
        {banner.buttonText || 'Shop now'} <ArrowRight className="ef-btn__arrow" aria-hidden="true" />
      </span>
    </div>
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Clock3 className="size-3.5" aria-hidden="true" />
      {countdown.mode === 'off'
        ? 'No countdown is shown.'
        : `"${countdown.label || 'Offer ends in'}" with a ${countdown.mode === 'custom' ? 'countdown to your end date' : 'countdown to the end of the month'}.`}
    </p>
  </div>
)

const DealsPage = () => {
  const [tab, setTab] = useState('products')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState([])

  const form = useForm({
    resolver: zodResolver(dealSettingsSchema),
    defaultValues: toFormValues(DEFAULT_DEAL_SETTINGS),
    mode: 'onChange',
  })
  const { control, formState } = form
  const values = form.watch()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    ;(async () => {
      try {
        const { data } = await axios.get('/api/deals/settings')
        if (!data.success) throw new Error(data.message)
        if (cancelled) return
        form.reset(toFormValues(data.data.settings))
        setSaved(data.data.settings)
        setUpdatedAt(data.data.updatedAt)
      } catch (error) {
        if (cancelled) return
        const message = error?.response?.data?.message || error.message
        setLoadError(message)
        showToast('error', message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [form, loadAttempt])

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!formState.isDirty) return
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [formState.isDirty])

  // Media picker → banner image.
  useEffect(() => {
    if (!mediaOpen && selectedMedia.length > 0) {
      const media = selectedMedia[0]
      if (media?.url && media.url !== form.getValues('banner.image.url')) {
        form.setValue('banner.image.url', media.url, { shouldDirty: true, shouldValidate: true })
        form.trigger('banner.image.alt')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaOpen, selectedMedia])

  const onSubmit = async (data) => {
    if (loading || !saved || saving) return
    setSaving(true)
    try {
      const { data: res } = await axios.put('/api/deals/settings', toPayload(data))
      if (!res.success) throw new Error(res.message)
      form.reset(toFormValues(res.data.settings))
      setSaved(res.data.settings)
      setUpdatedAt(res.data?.updatedAt || new Date().toISOString())
      showToast('success', res.message)
    } catch (error) {
      showToast('error', error?.response?.data?.message || error.message)
    } finally {
      setSaving(false)
    }
  }

  const onInvalid = () => {
    setTab('settings')
    showToast('error', 'Please fix the highlighted fields.')
  }

  const resetDefaults = () => {
    form.reset(toFormValues(DEFAULT_DEAL_SETTINGS), { keepDefaultValues: true })
    setSelectedMedia([])
    showToast('success', 'Defaults restored. Save to publish them.')
  }

  const live = describeLiveState(saved)
  const settingsHaveErrors = Object.keys(formState.errors || {}).length > 0
  const savedHasEnded = saved && dealHasEnded(saved.countdown)

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        title="Deals of the Month"
        description="Choose the deal products, the banner and the countdown for the homepage deals rail. Changes go live when you save."
        breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
        actions={
          <Button asChild variant="outline" className="h-9">
            <a href="/#deals-title" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" /> View on site
            </a>
          </Button>
        }
      />

      {live && !loading && (
        <div className={cn('flex items-start gap-2 rounded-md border px-4 py-3 text-sm', TONE_CLASS[live.tone])}>
          {live.tone === 'danger' ? <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <Clock3 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
          <span>{live.text}</span>
        </div>
      )}

      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <span>Could not load deal settings: {loadError}</span>
          <Button type="button" variant="outline" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
            Retry settings
          </Button>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="min-w-0 gap-4">
        <TabsList className="h-9 w-fit">
          <TabsTrigger value="products" className="px-3">Products</TabsTrigger>
          <TabsTrigger value="settings" className="relative px-3">
            Section &amp; banner
            {(formState.isDirty || settingsHaveErrors) && (
              <span
                className={cn('absolute right-1 top-1 size-1.5 rounded-full', settingsHaveErrors ? 'bg-destructive' : 'bg-[var(--brand-sun)]')}
                aria-label={settingsHaveErrors ? 'has errors' : 'unsaved changes'}
              />
            )}
          </TabsTrigger>
        </TabsList>

        {/* Both tabs stay mounted so an unsaved product order or form edit
            survives switching between them. */}
        <TabsContent value="products" forceMount className="data-[state=inactive]:hidden">
          <CuratedProductsManager config={PRODUCTS_CONFIG} />
        </TabsContent>

        <TabsContent value="settings" forceMount className="data-[state=inactive]:hidden">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="flex flex-col gap-4 sm:gap-6">
              {/* Sticky save bar */}
              <div className="sticky top-[4.5rem] z-20 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card/95 px-4 py-3 shadow-sm backdrop-blur">
                <div className="flex items-center gap-2 text-sm">
                  {loading || !saved ? (
                    <span className="text-muted-foreground">{loading ? 'Loading settings…' : 'Settings unavailable'}</span>
                  ) : formState.isDirty ? (
                    <span className="ef-tone--sun rounded-full border px-2.5 py-0.5 text-xs font-medium">Unsaved changes</span>
                  ) : (
                    <span className="ef-tone--forest rounded-full border px-2.5 py-0.5 text-xs font-medium">All changes saved</span>
                  )}
                  <span className="hidden text-muted-foreground sm:inline">
                    {updatedAt ? `Last published ${dayjs(updatedAt).format('DD MMM YYYY, hh:mm A')}` : 'Using the default design'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" className="h-9" onClick={resetDefaults} disabled={loading || !saved || saving}>
                    <RotateCcw className="size-4" /> Reset to defaults
                  </Button>
                  <Button type="button" variant="outline" className="h-9" disabled={!formState.isDirty || saving} onClick={() => form.reset()}>
                    Discard
                  </Button>
                  <ButtonLoading
                    type="submit"
                    loading={saving}
                    disabled={loading || !saved || saving}
                    className="h-9"
                    text={<span className="inline-flex items-center gap-2"><Save className="size-4" /> Save &amp; publish</span>}
                  />
                </div>
              </div>

              <fieldset disabled={loading || !saved || saving} className={cn('grid min-w-0 grid-cols-1 items-start gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]', (loading || !saved) && 'pointer-events-none opacity-60')}>
                <div className="flex min-w-0 flex-col gap-4">
                  <FieldGroup title="Section" description="The heading above the deals rail on the homepage.">
                    <SwitchField
                      control={control}
                      name="section.enabled"
                      label="Show Deals of the Month on the homepage"
                      description="Turn off to hide the whole section. Your products and banner are kept."
                    />
                    <TextField control={control} name="section.eyebrow" label="Eyebrow" placeholder="Limited time" maxLength={40} hint="The small pill above the headline. Leave empty to hide." />
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <TextField control={control} name="section.title" label="Headline" placeholder="Deals of" maxLength={40} />
                      <TextField control={control} name="section.titleAccent" label="Accent words" placeholder="the month" maxLength={40} hint="Shown in the accent colour." />
                    </div>
                    <AreaField control={control} name="section.description" label="Description" maxLength={200} rows={2} />
                  </FieldGroup>

                  <FieldGroup title="Countdown" description="The timer beside the headline.">
                    {savedHasEnded && (
                      <p className="ef-tone--danger flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        The last end date has passed, so the section is hidden. Pick a new end date or switch to the monthly countdown.
                      </p>
                    )}
                    <ChoiceField control={control} name="countdown.mode" options={COUNTDOWN_OPTIONS} />
                    {values.countdown?.mode === 'custom' && (
                      <FormField
                        control={control}
                        name="countdown.endsAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deal ends</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" min={dayjs().format(LOCAL_FORMAT)} {...field} value={field.value ?? ''} className="w-fit" />
                            </FormControl>
                            <FormDescription>In your local time. When it passes, the section hides itself.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {values.countdown?.mode !== 'off' && (
                      <TextField control={control} name="countdown.label" label="Timer label" placeholder="Offer ends in" maxLength={30} />
                    )}
                  </FieldGroup>

                  <FieldGroup title="Banner" description="The photo tile that opens the rail.">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="relative h-28 w-44 overflow-hidden rounded-md border bg-muted">
                        <Image src={values.banner?.image?.url || DEFAULT_DEAL_BANNER_IMAGE} alt="" fill sizes="176px" className="object-cover" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button type="button" variant="outline" className="h-9" onClick={() => setMediaOpen(true)}>
                          <ImagePlus className="size-4" /> {values.banner?.image?.url ? 'Change image' : 'Choose from media'}
                        </Button>
                        {values.banner?.image?.url && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-9 text-destructive hover:text-destructive/80"
                            onClick={() => {
                              form.setValue('banner.image.url', '', { shouldDirty: true, shouldValidate: true })
                              form.trigger('banner.image.alt')
                              setSelectedMedia([])
                            }}
                          >
                            <Trash2 className="size-4" /> Use the default photo
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground">Portrait photos work best. The top of the photo sits behind the text.</p>
                      </div>
                    </div>
                    <TextField
                      control={control}
                      name="banner.image.alt"
                      label="Image alt text"
                      placeholder="A gift tray of almonds and cashews"
                      maxLength={140}
                      hint={values.banner?.image?.url ? 'Required for your photo.' : 'Describes the default photo.'}
                    />
                    <TextField control={control} name="banner.title" label="Banner title" placeholder="Gift Boxes, Ready To Send" maxLength={60} />
                    <AreaField control={control} name="banner.copy" label="Banner copy" maxLength={140} rows={2} />
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <TextField control={control} name="banner.buttonText" label="Button text" placeholder="Shop now" maxLength={24} />
                      <TextField control={control} name="banner.link" label="Banner link" placeholder="/shop" hint="A storefront path like /category/gift-boxes, or a full https:// link." />
                    </div>
                  </FieldGroup>
                  <MediaModal
                    open={mediaOpen}
                    setOpen={setMediaOpen}
                    selectedMedia={selectedMedia}
                    setSelectedMedia={setSelectedMedia}
                    isMultiple={false}
                  />
                </div>

                <div className="min-w-0 xl:sticky xl:top-[9rem]">
                  <section className="rounded-md bg-card p-4 sm:p-6">
                    <h3 className="mb-4 text-sm font-semibold">Banner preview</h3>
                    {values.banner && values.countdown && <BannerPreview banner={values.banner} countdown={values.countdown} />}
                  </section>
                </div>
              </fieldset>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DealsPage
