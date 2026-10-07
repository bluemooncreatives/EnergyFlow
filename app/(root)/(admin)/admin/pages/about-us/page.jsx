'use client'

import { useFormContext, useWatch } from 'react-hook-form'
import PageContentEditor from '@/components/Application/Admin/page-content/PageContentEditor'
import { ImageField, ListField, TagsField } from '@/components/Application/Admin/page-content/PageFields'
import { AreaField, FieldGroup, SwitchField, TextField } from '@/components/Application/Admin/newsletter/SettingsFields'
import { ABOUT_PAGE_KEY, ABOUT_PAGE_LIMITS as L, ABOUT_PAGE_TEMPLATES, DEFAULT_ABOUT_PAGE } from '@/lib/pageContent/aboutPage'
import { aboutPageSchema } from '@/lib/pageContent/schema'
import { ADMIN_DASHBOARD, ADMIN_PAGES_ABOUT, ADMIN_TESTIMONIAL_SHOW } from '@/routes/AdminPanelRoute'

const breadcrumb = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_PAGES_ABOUT, label: 'About us page' },
]

const D = DEFAULT_ABOUT_PAGE
const item = (path) => () => structuredClone(ABOUT_PAGE_TEMPLATES[path])
const LINK_HINT = 'A storefront path like /contact, or a full https:// link.'

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

const TitlePair = ({ base, titleLabel = 'Headline', accentLabel = 'Accent words', accentHint = 'Shown in the accent colour.' }) => {
    const { control } = useFormContext()
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField control={control} name={`${base}.title`} label={titleLabel} maxLength={60} />
            <TextField control={control} name={`${base}.titleAccent`} label={accentLabel} maxLength={60} hint={accentHint} />
        </div>
    )
}

const HeroFields = () => {
    const { control } = useFormContext()
    return (
        <>
            <FieldGroup title="Hero" description="The page’s main heading, lead and buttons.">
                <TextField control={control} name="hero.eyebrow" label="Label" maxLength={40} />
                <TitlePair base="hero" titleLabel="First line" accentLabel="Second line" accentHint="Shown in the accent colour on its own line." />
                <AreaField control={control} name="hero.lead" label="Lead" maxLength={320} rows={3} />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <TextField control={control} name="hero.primaryLabel" label="Shop button" maxLength={30} hint="Always opens the shop." />
                    <TextField control={control} name="hero.secondaryLabel" label="Second button" maxLength={30} hint="Leave empty to hide." />
                </div>
                <TextField control={control} name="hero.secondaryHref" label="Second button link" hint={LINK_HINT} />
            </FieldGroup>
            <FieldGroup title="Photo mosaic" description="Three photos sliced into the rounded tile grid under the heading. A removed photo leaves its tiles as plain panels.">
                <ImageField name="hero.mosaic.left" label="Left photo" defaultImage={D.hero.mosaic.left} autoNote="None: plain tiles." />
                <ImageField name="hero.mosaic.centre" label="Centre photo (widest)" defaultImage={D.hero.mosaic.centre} autoNote="None: plain tiles." />
                <ImageField name="hero.mosaic.right" label="Right photo" defaultImage={D.hero.mosaic.right} autoNote="None: plain tiles." />
            </FieldGroup>
            <FieldGroup title="Figures" description="The row of numbers under the mosaic. Write {categories} or {products} to show the live count from the catalogue; a figure that would read zero is hidden.">
                <ListField
                    name="hero.stats"
                    label="Figures"
                    noun="figure"
                    max={L.stats}
                    newItem={item('hero.stats')}
                    itemTitle={(value) => [value.value, value.label].filter(Boolean).join(' · ')}
                    renderItem={(prefix) => (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[10rem_minmax(0,1fr)]">
                            <TextField control={control} name={`${prefix}.value`} label="Value" maxLength={20} />
                            <TextField control={control} name={`${prefix}.label`} label="Label" maxLength={40} />
                        </div>
                    )}
                />
            </FieldGroup>
            <FieldGroup title="Statement" description="The scroll-lit introduction under the hero.">
                <SectionSwitch name="statement.enabled" label="Show the statement" />
            </FieldGroup>
        </>
    )
}

const PromiseFields = () => {
    const { control } = useFormContext()
    return (
        <>
            <FieldGroup title="Why shoppers stay" description="A tall photo with a quote, the promise as a large quote, the pillars as chips, and a row of a second photo, copy and a delivery card.">
                <SectionSwitch name="promise.enabled" label="Show this section" />
                <TextField control={control} name="promise.label" label="Section label" maxLength={40} hint="The small // label over the section." />
                <AreaField control={control} name="promise.statement" label="Promise (large quote)" maxLength={200} rows={3} />
                <TagsField name="promise.pillars" label="Pillars" max={L.pillars} maxLength={40} hint="Short chips under the quote." />
            </FieldGroup>
            <FieldGroup title="Photos & copy">
                <ImageField name="promise.photo" label="Tall photo" defaultImage={D.promise.photo} autoNote="None: pine artwork." />
                <TextField control={control} name="promise.photoQuote" label="Quote on the tall photo" maxLength={120} />
                <ImageField name="promise.secondaryPhoto" label="Second photo" defaultImage={D.promise.secondaryPhoto} autoNote="None: the copy takes its place." />
                <AreaField control={control} name="promise.secondaryText" label="Supporting copy" maxLength={200} rows={2} />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <TextField control={control} name="promise.ctaLabel" label="Button text" maxLength={30} hint="Leave empty to hide." />
                    <TextField control={control} name="promise.ctaHref" label="Button link" hint={LINK_HINT} />
                </div>
            </FieldGroup>
            <FieldGroup title="Delivery card" description="The first row is shown large; the rest get bars sized by the largest number in their value (e.g. 4 in “2-4 days”).">
                <TextField control={control} name="promise.timelineTitle" label="Card title" maxLength={40} />
                <ListField
                    name="promise.timeline"
                    label="Rows"
                    noun="row"
                    max={L.timeline}
                    newItem={item('promise.timeline')}
                    itemTitle={(value) => [value.label, value.value].filter(Boolean).join(' · ')}
                    renderItem={(prefix) => (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <TextField control={control} name={`${prefix}.label`} label="Label" maxLength={30} />
                            <TextField control={control} name={`${prefix}.value`} label="Value" maxLength={20} />
                        </div>
                    )}
                />
            </FieldGroup>
        </>
    )
}

const RangeFields = () => {
    const { control } = useFormContext()
    return (
        <>
            <FieldGroup title="Explore the pantry" description="A panel with a search box and a row of category photos. The categories, counts and photos come from the catalogue (set category covers in Category → Edit).">
                <SectionSwitch name="range.enabled" label="Show this section" />
                <TextField control={control} name="range.eyebrow" label="Section label" maxLength={40} />
                <TextField control={control} name="range.title" label="Headline" maxLength={60} />
                <TextField control={control} name="range.searchPlaceholder" label="Search placeholder" maxLength={40} />
                <AreaField control={control} name="range.note" label="Note under the row" maxLength={260} rows={3} />
            </FieldGroup>
            <FieldGroup title="How we work" description="The headline and lead with a chip per step; the chosen step opens in a card, beside a photo carrying a tracker that fills as you move through the steps.">
                <SectionSwitch name="sourcing.enabled" label="Show this section" />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <TextField control={control} name="sourcing.eyebrow" label="Label" maxLength={40} />
                    <TextField control={control} name="sourcing.indexLabel" label="Small line under the lead" maxLength={40} />
                </div>
                <TitlePair base="sourcing" titleLabel="First line" accentLabel="Second line" />
                <AreaField control={control} name="sourcing.lead" label="Lead" maxLength={300} rows={3} />
                <ImageField name="sourcing.image" label="Photo" defaultImage={D.sourcing.image} autoNote="None: a plain panel." />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <TextField control={control} name="sourcing.photoEyebrow" label="Tracker label" maxLength={40} />
                    <TextField control={control} name="sourcing.photoTitle" label="Photo caption" maxLength={60} />
                </div>
            </FieldGroup>
            <FieldGroup title="Sourcing steps">
                <ListField
                    name="sourcing.steps"
                    label="Steps"
                    noun="step"
                    max={L.steps}
                    newItem={item('sourcing.steps')}
                    itemTitle={(value) => value.title}
                    renderItem={(prefix) => (
                        <>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[12rem_minmax(0,1fr)]">
                                <TextField control={control} name={`${prefix}.phase`} label="Phase" maxLength={30} />
                                <TextField control={control} name={`${prefix}.title`} label="Title" maxLength={60} />
                            </div>
                            <AreaField control={control} name={`${prefix}.body`} label="Body" maxLength={320} rows={3} />
                        </>
                    )}
                />
            </FieldGroup>
        </>
    )
}

const PeopleFields = () => {
    const { control } = useFormContext()
    return (
        <>
            <FieldGroup title="Who runs it" description="A large portrait of the chosen person beside a list of everyone; the chosen entry opens with their bio.">
                <SectionSwitch name="leadership.enabled" label="Show this section" />
                <TextField control={control} name="leadership.label" label="Section label" maxLength={40} />
                <TitlePair base="leadership" />
                <AreaField control={control} name="leadership.description" label="Description" maxLength={320} rows={3} />
            </FieldGroup>
            <FieldGroup title="People" description="Only real photos: without one, a monogram of their initials shows.">
                <ListField
                    name="leadership.people"
                    label="People"
                    noun="person"
                    max={L.people}
                    newItem={item('leadership.people')}
                    itemTitle={(value) => value.name}
                    renderItem={(prefix) => (
                        <>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <TextField control={control} name={`${prefix}.name`} label="Name" maxLength={60} />
                                <TextField control={control} name={`${prefix}.role`} label="Role" maxLength={80} />
                            </div>
                            <AreaField control={control} name={`${prefix}.bio`} label="Bio" maxLength={1200} rows={6} hint="Leave a blank line between paragraphs." />
                            <TextField control={control} name={`${prefix}.quote`} label="Their words (over the portrait)" maxLength={140} />
                            <ImageField name={`${prefix}.photo`} label="Portrait" autoNote="None: their monogram shows." />
                        </>
                    )}
                />
            </FieldGroup>
            <FieldGroup
                title="What shoppers tell us"
                description={<>A pine panel showing one testimonial at a time. The quotes themselves are managed in <a className="underline underline-offset-2" href={ADMIN_TESTIMONIAL_SHOW}>Testimonials</a>; the section hides while there are none.</>}
            >
                <SectionSwitch name="testimonials.enabled" label="Show this section" />
                <TextField control={control} name="testimonials.label" label="Section label" maxLength={40} />
                <TextField control={control} name="testimonials.title" label="Headline" maxLength={60} />
                <ImageField name="testimonials.image" label="Photo" defaultImage={D.testimonials.image} autoNote="None: the quote takes the space." />
            </FieldGroup>
        </>
    )
}

const WorkFields = () => {
    const { control } = useFormContext()
    return (
        <>
            <FieldGroup title="Work with us" description="A row of photo cards, one per offer: the chosen card opens wide with its title, copy and button, the rest show their label.">
                <SectionSwitch name="work.enabled" label="Show this section" />
                <TextField control={control} name="work.label" label="Section label" maxLength={40} />
                <TitlePair base="work" />
                <AreaField control={control} name="work.description" label="Description (beside the headline)" maxLength={320} rows={3} />
            </FieldGroup>
            <FieldGroup title="Tabs">
                <ListField
                    name="work.tabs"
                    label="Tabs"
                    noun="tab"
                    max={L.tabs}
                    newItem={() => ({ ...item('work.tabs')(), ctaHref: '/contact' })}
                    itemTitle={(value) => value.label}
                    renderItem={(prefix) => (
                        <>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[12rem_minmax(0,1fr)]">
                                <TextField control={control} name={`${prefix}.label`} label="Tab label" maxLength={24} />
                                <TextField control={control} name={`${prefix}.title`} label="Title" maxLength={60} />
                            </div>
                            <AreaField control={control} name={`${prefix}.body`} label="Copy" maxLength={320} rows={3} />
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <TextField control={control} name={`${prefix}.ctaLabel`} label="Button text" maxLength={30} />
                                <TextField control={control} name={`${prefix}.ctaHref`} label="Button link" hint={LINK_HINT} />
                            </div>
                            <ImageField name={`${prefix}.image`} label="Photo" autoNote="None: pine artwork." />
                        </>
                    )}
                />
            </FieldGroup>
        </>
    )
}

const VisitFields = () => {
    const { control } = useFormContext()
    return (
        <>
            <FieldGroup title="Come and find us" description="The store invitation, address and directions. The address, phone and email are the company details used across the site.">
                <SectionSwitch name="visit.enabled" label="Show this section" />
                <TextField control={control} name="visit.label" label="Section label" maxLength={40} />
                <AreaField control={control} name="visit.statement" label="Invitation" maxLength={240} rows={3} />
                <TextField control={control} name="visit.ctaLabel" label="Directions button" maxLength={30} hint="Opens Google Maps at the store address." />
                <AreaField control={control} name="visit.note" label="Note under the address" maxLength={160} rows={2} />
            </FieldGroup>
            <FieldGroup title="Photos" description="Listed beside the tall photo by their tag and caption; hovering a row shows its photo. With none, the store front photo shows.">
                <ListField
                    name="visit.photos"
                    label="Photos"
                    noun="photo"
                    max={L.photos}
                    newItem={item('visit.photos')}
                    itemTitle={(value) => value.tag || value.caption}
                    renderItem={(prefix) => (
                        <>
                            <ImageField name={`${prefix}.image`} label="Photo" autoNote="Choose a photo, or this entry is skipped." />
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <TextField control={control} name={`${prefix}.tag`} label="Tag" maxLength={30} />
                                <TextField control={control} name={`${prefix}.caption`} label="Caption" maxLength={80} />
                            </div>
                        </>
                    )}
                />
            </FieldGroup>
            <FieldGroup title="You may also like" description="A pine band at the end of the page with up to eight bestsellers in a row that scrolls.">
                <SectionSwitch name="related.enabled" label="Show product picks" />
                <TextField control={control} name="related.eyebrow" label="Label" maxLength={40} />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <TextField control={control} name="related.title" label="Headline" maxLength={40} />
                    <TextField control={control} name="related.titleAccent" label="Accent words" maxLength={40} />
                </div>
            </FieldGroup>
        </>
    )
}

const SECTIONS = [
    { value: 'hero', label: 'Hero', keys: ['hero', 'statement'], content: <HeroFields /> },
    { value: 'promise', label: 'Promise', keys: ['promise'], content: <PromiseFields /> },
    { value: 'range', label: 'Range & sourcing', keys: ['range', 'sourcing'], content: <RangeFields /> },
    { value: 'people', label: 'People & reviews', keys: ['leadership', 'testimonials'], content: <PeopleFields /> },
    { value: 'work', label: 'Work with us', keys: ['work'], content: <WorkFields /> },
    { value: 'visit', label: 'Visit & picks', keys: ['visit', 'related'], content: <VisitFields /> },
]

const AboutPageEditor = () => (
    <PageContentEditor
        pageKey={ABOUT_PAGE_KEY}
        title="About us page"
        description="The copy, photos and lists of /about-us. Catalogue figures, categories, reviews and testimonials stay live. Changes go live when you publish."
        viewHref="/about-us"
        breadcrumb={breadcrumb}
        schema={aboutPageSchema}
        defaults={DEFAULT_ABOUT_PAGE}
        sections={SECTIONS}
    />
)

export default AboutPageEditor
