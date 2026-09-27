import NotFoundContent from '@/components/Application/Website/storefront/NotFoundContent'

// Rendered for routes that don't match any page in the app.
// Runs inside app/layout.jsx (GlobalProvider + LenisProvider) but outside
// the website layout, so the header/footer are not present here.
export default function GlobalNotFound() {
    return (
        <div className="font-neue">
            <NotFoundContent />
        </div>
    )
}
