import UnsubscribeClient from './UnsubscribeClient'

export const metadata = {
    title: 'Newsletter preferences',
    robots: { index: false, follow: false },
}

const UnsubscribePage = async ({ searchParams }) => {
    const { token } = await searchParams
    return <UnsubscribeClient token={typeof token === 'string' ? token : ''} />
}

export default UnsubscribePage
