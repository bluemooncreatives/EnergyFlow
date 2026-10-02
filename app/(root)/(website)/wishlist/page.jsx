import WishlistPageClient from '@/components/Application/Website/WishlistPageClient'

// Public on purpose: guests keep a wishlist on their device, signed-in
// shoppers on their account. The client decides which one to show.
const WishlistPage = () => <WishlistPageClient />

export default WishlistPage
