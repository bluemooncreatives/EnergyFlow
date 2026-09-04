'use client'
import dynamic from 'next/dynamic'
import { store } from '@/store/store'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AuthHydrator from '@/components/Application/AuthHydrator'

const ReactQueryDevtools = process.env.NODE_ENV === 'development'
    ? dynamic(() => import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools })), { ssr: false })
    : null

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        },
        mutations: {
            retry: 0
        }
    }
})

const GlobalProvider = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <Provider store={store}>
                <AuthHydrator />
                {children}
            </Provider>
            {ReactQueryDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
        </QueryClientProvider>
    )
}

export default GlobalProvider
