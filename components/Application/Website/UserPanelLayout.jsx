import UserPanelNavigation from './UserPanelNavigation'

const UserPanelLayout = ({ children }) => {
    return (
        <section className="website-gutter bg-background py-10 lg:py-14 font-neue">
            <div className="grid w-full gap-6 lg:grid-cols-[260px_1fr] lg:gap-8">
                <aside className="w-full">
                    <div className="sticky top-6">
                        <UserPanelNavigation />
                    </div>
                </aside>
                <div className="w-full min-w-0">
                    {children}
                </div>
            </div>
        </section>
    )
}

export default UserPanelLayout