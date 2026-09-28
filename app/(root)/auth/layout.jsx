import './auth.css'

// Auth pages sit outside the storefront chrome: a tinted canvas with one
// centred AuthShell card (components/Application/Auth).
const layout = ({ children }) => {
    return (
        <main className='ef-auth-page'>
            {children}
        </main>
    )
}

export default layout
