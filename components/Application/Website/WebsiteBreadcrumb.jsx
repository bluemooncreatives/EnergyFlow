import PageHero from '@/components/Application/Website/storefront/PageHero'

// Page header used by /my-account, /orders, /checkout, the legal pages…
// Kept as a thin adapter over the storefront PageHero so existing callers keep
// passing `{ title, links, description? }` unchanged.
const WebsiteBreadcrumb = ({ props = {} }) => (
    <PageHero title={props.title} links={props.links} description={props.description} />
)

export default WebsiteBreadcrumb
