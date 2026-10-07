'use client'

import { useFormContext, useWatch } from 'react-hook-form'
import PageContentEditor from '@/components/Application/Admin/page-content/PageContentEditor'
import { ImageField, ListField, RatingField, SelectField, TagsField } from '@/components/Application/Admin/page-content/PageFields'
import { AreaField, FieldGroup, SwitchField, TextField } from '@/components/Application/Admin/newsletter/SettingsFields'
import { OCCASIONS } from '@/lib/giftEnquiry'
import { DEFAULT_GIFT_PAGE, GIFT_PAGE_KEY, GIFT_PAGE_LIMITS as L, GIFT_PAGE_TEMPLATES } from '@/lib/pageContent/giftPage'
import { giftPageSchema } from '@/lib/pageContent/schema'
import { ADMIN_DASHBOARD, ADMIN_PAGES_GIFT_BOXES } from '@/routes/AdminPanelRoute'

const breadcrumb = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_PAGES_GIFT_BOXES, label: 'Gift boxes page' },
]

const AUTO = 'Automatic: a gift box photo from the catalogue.'
const item = (path) => () => structuredClone(GIFT_PAGE_TEMPLATES[path])

// A section switch plus a note while it is off.
const SectionSwitch = ({ name, label, description }) => {
    const { control } = useFormContext()
    const enabled = useWatch({ control, name })
    return (
        <>
            <SwitchField control={control} name={name} label={label} description={description} />
            {enabled === false && (
                <p className="ef-tone--sun rounded-md border px-3 py-2 text-xs">Hidden from the page. Everything below is kept for when you switch it back on.</p>
            )}
        </>
    )
}

const Headline = ({ base, eyebrow = true, eyebrowHint }) => {
    const { control } = useFormContext()
    return (
        <>
            {eyebrow && <TextField control={control} name={`${base}.eyebrow`} label="Label" maxLength={40} hint={eyebrowHint || 'The small pill beside the section number.'} />}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <TextField control={control} name={`${base}.title`} label="Headline" maxLength={60} />
                <TextField control={control} name={`${base}.titleAccent`} label="Accent words" maxLength={60} hint="Shown in the accent colour." />
            </div>
        </>
    )
}

const HeroFields = () => {
    const { control } = useFormContext()
    return (
        <>
            <FieldGroup title="Wordmark & caption row" description="The giant headline across the top of the page (the page’s main heading), and the thin row under it.">
                <TextField control={control} name="hero.wordmark" label="Wordmark" maxLength={24} hint="Short is best: it is sized to fill the full width. 6–14 characters look strongest." />
                <TextField control={control} name="hero.tagline" label="Tagline (left)" maxLength={90} />
                <TextField control={control} name="hero.scrollLabel" label="Scroll cue (right)" maxLength={30} hint="Jumps to the boxes. Hidden on phones, where only the arrow shows." />
            </FieldGroup>
            <FieldGroup title="Hero photo" description="The full-width photograph under the wordmark.">
                <ImageField name="hero.image" label="Photo" autoNote={AUTO} hint="Wide, landscape photos work best. The bottom sits behind the caption." />
                <TextField control={control} name="hero.badge" label="Pill on the photo" maxLength={36} hint="Leave empty to hide." />
                <AreaField control={control} name="hero.caption" label="Caption on the photo" maxLength={200} rows={3} />
            </FieldGroup>
            <FieldGroup title="Ticker strip" description="The pine strip of short phrases under the photo.">
                <SectionSwitch name="ticker.enabled" label="Show the ticker" />
                <TagsField name="ticker.items" label="Phrases" max={L.tickerItems} maxLength={40} hint="Short promises read best. At least two while the ticker is on." />
            </FieldGroup>
        </>
    )
}

const CollectionFields = () => {
    const { control } = useFormContext()
    return (
        <>
            <FieldGroup title="Collection" description="The boxes themselves come from Products in the Gift Boxes category. This is the copy around them.">
                <Headline base="collection" eyebrowHint="The small pill beside the section number." />
                <p className="text-xs text-muted-foreground">With accent words, the headline reads as an accent line on top, then the accent words below.</p>
                <AreaField control={control} name="collection.note" label="Lead" maxLength={240} rows={3} hint="The short paragraph under the headline." />
                <TextField control={control} name="collection.listTitle" label="List name (screen readers)" maxLength={30} hint="Read out for the list of boxes." />
            </FieldGroup>
        </>
    )
}

const OccasionFields = () => {
    const { control } = useFormContext()
    return (
        <>
            <FieldGroup title="Occasions band" description="The pine band of tall photo cards. Each card opens the enquiry form with its occasion picked.">
                <SectionSwitch name="occasions.enabled" label="Show the occasions band" />
                <Headline base="occasions" />
                <AreaField control={control} name="occasions.label" label="Side note" maxLength={120} rows={2} />
            </FieldGroup>
            <FieldGroup title="Occasion cards">
                <ListField
                    name="occasions.items"
                    label="Cards"
                    noun="card"
                    max={L.occasions}
                    newItem={item('occasions.items')}
                    itemTitle={(value) => value.title}
                    renderItem={(prefix) => (
                        <>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <TextField control={control} name={`${prefix}.title`} label="Title" maxLength={40} />
                                <SelectField name={`${prefix}.occasion`} label="Opens the form with" options={OCCASIONS} />
                            </div>
                            <AreaField control={control} name={`${prefix}.note`} label="Note" maxLength={120} rows={2} />
                            <ImageField name={`${prefix}.image`} label="Card photo" autoNote={AUTO} hint="Portrait photos work best." />
                        </>
                    )}
                />
            </FieldGroup>
        </>
    )
}

const PromiseFields = () => {
    const { control } = useFormContext()
    return (
        <>
            <FieldGroup title="Promise cards" description="A row of cards under a numbered heading: the first is a wide photo card, then white, photo and sunflower cards in turn.">
                <SectionSwitch name="promise.enabled" label="Show the promise cards" />
                <Headline base="promise" />
                <AreaField control={control} name="promise.note" label="Note under the row" maxLength={220} rows={2} />
            </FieldGroup>
            <FieldGroup title="Cards">
                <ListField
                    name="promise.items"
                    label="Cards"
                    noun="card"
                    max={L.promises}
                    newItem={item('promise.items')}
                    itemTitle={(value) => value.title}
                    renderItem={(prefix, index) => (
                        <>
                            <TextField control={control} name={`${prefix}.title`} label="Title" maxLength={50} />
                            <AreaField control={control} name={`${prefix}.copy`} label="Copy" maxLength={200} rows={3} />
                            <TagsField name={`${prefix}.tags`} label="Tags" max={L.tags} maxLength={32} />
                            <ImageField
                                name={`${prefix}.image`}
                                label="Photo"
                                autoNote={AUTO}
                                hint={index === 0 ? 'The wide lead card.' : (index - 1) % 3 === 2 ? 'Sunflower cards show no photo.' : undefined}
                            />
                        </>
                    )}
                />
            </FieldGroup>
        </>
    )
}

const ProcessFields = () => {
    const { control } = useFormContext()
    return (
        <>
            <FieldGroup title="How bulk orders work" description="An accent line over the headline, a lead and a photo, beside an indexed list of steps that open one at a time.">
                <SectionSwitch name="process.enabled" label="Show the steps" />
                <TextField control={control} name="process.eyebrow" label="Label" maxLength={40} />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <TextField control={control} name="process.kicker" label="Accent line" maxLength={40} hint="Shown above the headline in the accent colour." />
                    <TextField control={control} name="process.title" label="Headline" maxLength={60} />
                </div>
                <AreaField control={control} name="process.description" label="Lead" maxLength={240} rows={3} />
                <TextField control={control} name="process.ctaLabel" label="Button text" maxLength={30} hint="Under the list; opens the enquiry form." />
                <ImageField name="process.image" label="Photo" defaultImage={DEFAULT_GIFT_PAGE.process.image} autoNote="None: no photo. This section never borrows box photos, so it can’t repeat the collection." />
            </FieldGroup>
            <FieldGroup title="Steps">
                <ListField
                    name="process.items"
                    label="Steps"
                    noun="step"
                    max={L.steps}
                    newItem={item('process.items')}
                    itemTitle={(value) => value.title}
                    renderItem={(prefix) => (
                        <>
                            <TextField control={control} name={`${prefix}.title`} label="Step title" maxLength={50} />
                            <AreaField control={control} name={`${prefix}.copy`} label="Detail" maxLength={260} rows={3} />
                            <TagsField name={`${prefix}.tags`} label="What it covers" max={L.tags} maxLength={32} />
                            <ImageField name={`${prefix}.image`} label="Step thumbnail" autoNote="None: the open step shows no thumbnail." hint="Shown top-right of the open step." />
                        </>
                    )}
                />
            </FieldGroup>
        </>
    )
}

const TestimonialFields = () => {
    const { control } = useFormContext()
    return (
        <>
            <FieldGroup title="Testimonials" description="Quote cards from teams you have gifted for. The section only shows once you add at least one, and only real quotes belong here.">
                <SectionSwitch name="testimonials.enabled" label="Show testimonials" />
                <Headline base="testimonials" />
                <ImageField name="testimonials.image" label="Side photo (desktop)" autoNote={AUTO} />
            </FieldGroup>
            <FieldGroup title="Quotes">
                <ListField
                    name="testimonials.items"
                    label="Quotes"
                    noun="quote"
                    max={L.testimonials}
                    newItem={item('testimonials.items')}
                    itemTitle={(value) => [value.name, value.company].filter(Boolean).join(' · ')}
                    renderItem={(prefix) => (
                        <>
                            <AreaField control={control} name={`${prefix}.quote`} label="Quote" maxLength={400} rows={4} />
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <TextField control={control} name={`${prefix}.name`} label="Name" maxLength={60} />
                                <TextField control={control} name={`${prefix}.role`} label="Role" maxLength={60} />
                                <TextField control={control} name={`${prefix}.company`} label="Company" maxLength={60} hint="Shown as a pill on the card." />
                                <RatingField name={`${prefix}.rating`} />
                            </div>
                            <ImageField name={`${prefix}.photo`} label="Their photo" autoNote="None: their initials show instead." />
                        </>
                    )}
                />
            </FieldGroup>
        </>
    )
}

const EnquiryFields = () => {
    const { control } = useFormContext()
    return (
        <>
            <FieldGroup title="Enquiry form heading" description="The form itself (steps, fields, validation) is fixed; this is the heading above it.">
                <Headline base="enquiry" />
                <AreaField control={control} name="enquiry.description" label="Description" maxLength={240} rows={3} />
                <TagsField name="enquiry.perks" label="Perks" max={L.perks} maxLength={40} hint="Short ticked chips under the description." />
            </FieldGroup>
            <FieldGroup title="Closing banner" description="The pine banner at the very end of the page.">
                <SectionSwitch name="cta.enabled" label="Show the closing banner" />
                <TextField control={control} name="cta.eyebrow" label="Label" maxLength={40} />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <TextField control={control} name="cta.title" label="Headline" maxLength={60} />
                    <TextField control={control} name="cta.titleAccent" label="Accent words" maxLength={60} />
                </div>
                <AreaField control={control} name="cta.description" label="Description" maxLength={220} rows={2} />
                <TextField control={control} name="cta.buttonLabel" label="Button text" maxLength={30} hint="Opens the enquiry form." />
                <ImageField name="cta.image" label="Banner photo" autoNote={AUTO} />
            </FieldGroup>
        </>
    )
}

const FaqFields = () => {
    const { control } = useFormContext()
    return (
        <>
            <FieldGroup title="FAQs" description="Shown with the gifting team’s direct lines. With no questions of your own, the Gift Boxes category’s standard FAQs show.">
                <SectionSwitch name="faq.enabled" label="Show FAQs" />
                <Headline base="faq" />
                <AreaField control={control} name="faq.description" label="Description" maxLength={200} rows={2} />
            </FieldGroup>
            <FieldGroup title="Questions" description="They also feed the FAQ rich result in Google.">
                <ListField
                    name="faq.items"
                    label="Questions"
                    noun="question"
                    max={L.faqs}
                    newItem={item('faq.items')}
                    itemTitle={(value) => value.question}
                    renderItem={(prefix) => (
                        <>
                            <TextField control={control} name={`${prefix}.question`} label="Question" maxLength={160} />
                            <AreaField control={control} name={`${prefix}.answer`} label="Answer" maxLength={800} rows={4} />
                        </>
                    )}
                />
            </FieldGroup>
        </>
    )
}

const SECTIONS = [
    { value: 'hero', label: 'Hero & ticker', keys: ['hero', 'ticker'], content: <HeroFields /> },
    { value: 'collection', label: 'Collection', keys: ['collection'], content: <CollectionFields /> },
    { value: 'occasions', label: 'Occasions', keys: ['occasions'], content: <OccasionFields /> },
    { value: 'promise', label: 'Promise', keys: ['promise'], content: <PromiseFields /> },
    { value: 'process', label: 'Process', keys: ['process'], content: <ProcessFields /> },
    { value: 'testimonials', label: 'Testimonials', keys: ['testimonials'], content: <TestimonialFields /> },
    { value: 'enquiry', label: 'Enquiry & banner', keys: ['enquiry', 'cta'], content: <EnquiryFields /> },
    { value: 'faq', label: 'FAQs', keys: ['faq'], content: <FaqFields /> },
]

const GiftBoxesPageEditor = () => (
    <PageContentEditor
        pageKey={GIFT_PAGE_KEY}
        title="Gift boxes page"
        description="The copy, photos and lists around the gift box collection at /category/gift-boxes. Changes go live when you publish."
        viewHref="/category/gift-boxes"
        breadcrumb={breadcrumb}
        schema={giftPageSchema}
        defaults={DEFAULT_GIFT_PAGE}
        sections={SECTIONS}
    />
)

export default GiftBoxesPageEditor
