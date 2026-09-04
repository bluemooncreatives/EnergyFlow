'use client'
import { useEffect } from 'react'
import axios from 'axios'
import { useDispatch, useStore } from 'react-redux'
import { login, logout } from '@/store/reducer/authReducer'

/**
 * Resolves the signed-in user from the server once on app load and mirrors it into
 * the Redux auth store. This is what makes the navbar / dashboard sidebar show the
 * real name + avatar reliably — Redux `authStore` is intentionally NOT persisted,
 * and Google sign-in never dispatched `login` on the client, so without this the
 * client believed nobody was logged in after every refresh.
 */
const AuthHydrator = () => {
    const dispatch = useDispatch()
    const store = useStore()

    useEffect(() => {
        const controller = new AbortController()

        const hydrate = async () => {
            try {
                const { data } = await axios.get('/api/auth/me', { signal: controller.signal })
                if (data?.success && data?.data) {
                    dispatch(login(data.data))
                } else {
                    // Only mark logged-out if nobody logged in while this request was
                    // in flight (an explicit login dispatch is authoritative).
                    if (!store.getState().authStore?.auth) {
                        dispatch(logout())
                    }
                }
            } catch (error) {
                if (axios.isCancel(error) || error?.name === 'CanceledError') return
                if (!store.getState().authStore?.auth) {
                    dispatch(logout())
                }
            }
        }

        hydrate()
        return () => controller.abort()
    }, [dispatch, store])

    return null
}

export default AuthHydrator
