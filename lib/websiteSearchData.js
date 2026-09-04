import {
    Home,
    Store,
    Crown,
    Info,
    Mail,
    ShieldCheck,
    FileText,
    ShoppingBag,
    CreditCard,
    UserRound,
    Package,
    Settings,
    LogIn,
    UserPlus,
} from 'lucide-react'
import {
    WEBSITE_HOME,
    WEBSITE_SHOP,
    WEBSITE_CART,
    WEBSITE_CHECKOUT,
    WEBSITE_LOGIN,
    WEBSITE_REGISTER,
    USER_DASHBOARD,
    USER_ORDERS,
    USER_PROFILE,
} from '@/routes/WebsiteRoute'

/**
 * Static destinations the global search can jump to — pages, shortcuts and
 * curated shop views. Matched fuzzily (Fuse.js) so "best seller", "track order"
 * etc. resolve to the right place.
 *
 * Auth visibility mirrors middleware.js so we never surface a link that would
 * only bounce the user:
 *   requiresAuth → /my-account, /profile, /orders, /checkout (protected routes)
 *   guestOnly    → /auth/* (logged-in users are redirected away from these)
 */
const websiteSearchData = [
    {
        label: 'Home',
        description: 'Back to the homepage',
        url: WEBSITE_HOME,
        icon: Home,
        keywords: ['home', 'main', 'landing', 'start'],
    },
    {
        label: 'Shop All Products',
        description: 'Browse the full collection',
        url: WEBSITE_SHOP,
        icon: Store,
        keywords: ['shop', 'store', 'products', 'collection', 'catalog', 'catalogue', 'browse', 'all', 'new'],
    },
    {
        label: 'Bestsellers',
        description: 'Our most popular products',
        url: `${WEBSITE_SHOP}?bestseller=true`,
        icon: Crown,
        keywords: ['bestseller', 'best seller', 'best sellers', 'popular', 'trending', 'top', 'hot', 'favourite', 'favorite'],
    },
    {
        label: 'About Us',
        description: 'Our story and mission',
        url: '/about-us',
        icon: Info,
        keywords: ['about', 'story', 'company', 'who we are', 'mission', 'brand'],
    },
    {
        label: 'Contact',
        description: 'Get in touch with our team',
        url: '/contact',
        icon: Mail,
        keywords: ['contact', 'support', 'help', 'email', 'reach', 'customer service', 'enquiry', 'inquiry', 'query'],
    },
    {
        label: 'Cart',
        description: 'Items in your shopping bag',
        url: WEBSITE_CART,
        icon: ShoppingBag,
        keywords: ['cart', 'bag', 'basket', 'shopping bag'],
    },
    {
        label: 'Checkout',
        description: 'Complete your purchase',
        url: WEBSITE_CHECKOUT,
        icon: CreditCard,
        keywords: ['checkout', 'buy', 'pay', 'payment', 'place order'],
        requiresAuth: true,
    },
    {
        label: 'My Account',
        description: 'Your account dashboard',
        url: USER_DASHBOARD,
        icon: UserRound,
        keywords: ['account', 'dashboard', 'my account'],
        requiresAuth: true,
    },
    {
        label: 'My Orders',
        description: 'Track and view your orders',
        url: USER_ORDERS,
        icon: Package,
        keywords: ['orders', 'order history', 'purchases', 'track', 'track order', 'my orders', 'delivery'],
        requiresAuth: true,
    },
    {
        label: 'Profile',
        description: 'Manage your personal details',
        url: USER_PROFILE,
        icon: Settings,
        keywords: ['profile', 'settings', 'address', 'details', 'personal', 'password'],
        requiresAuth: true,
    },
    {
        label: 'Sign In',
        description: 'Log in to your account',
        url: WEBSITE_LOGIN,
        icon: LogIn,
        keywords: ['login', 'log in', 'sign in', 'signin'],
        guestOnly: true,
    },
    {
        label: 'Create Account',
        description: 'Register a new account',
        url: WEBSITE_REGISTER,
        icon: UserPlus,
        keywords: ['register', 'sign up', 'signup', 'create account', 'join'],
        guestOnly: true,
    },
    {
        label: 'Privacy Policy',
        description: 'How we handle your data',
        url: '/privacy-policy',
        icon: ShieldCheck,
        keywords: ['privacy', 'policy', 'data', 'gdpr'],
    },
    {
        label: 'Terms & Conditions',
        description: 'Our terms of service',
        url: '/terms-and-conditions',
        icon: FileText,
        keywords: ['terms', 'conditions', 'tos', 'legal', 'agreement', 'refund', 'return'],
    },
]

export default websiteSearchData
