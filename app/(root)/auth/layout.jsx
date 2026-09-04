import './auth.css'

const layout = ({ children }) => {
    return (
        <div className='admin-theme auth-theme min-h-screen w-full bg-muted p-4 md:p-6'>
            <div className='mx-auto flex min-h-[calc(100vh-2rem)] w-full items-center justify-center md:min-h-[calc(100vh-3rem)]'>
                {children}
            </div>
        </div>
    )
}

export default layout
