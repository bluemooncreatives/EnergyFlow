import axios from "axios"
import { useEffect, useMemo, useState } from "react"

const useFetch = (url, method = "GET", options = {}) => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [refreshIndex, setRefreshIndex] = useState(0)

    const optionsString = JSON.stringify(options)
    const requestOptions = useMemo(() => {
        const opts = { ...options }
        if (method === 'POST' && !opts.data) {
            opts.data = {}
        }
        return opts
    }, [method, optionsString])

    useEffect(() => {
        const controller = new AbortController()

        const apiCall = async () => {
            setLoading(true)
            setError(null)
            try {
                const { data: response } = await axios({
                    url,
                    method,
                    signal: controller.signal,
                    ...(requestOptions)
                })

                if (!response.success) {
                    throw new Error(response.message)
                }

                setData(response)
            } catch (error) {
                if (axios.isCancel(error)) {
                    return
                }
                setError(error.message)
            } finally {
                setLoading(false)
            }
        }

        apiCall()

        return () => {
            controller.abort()
        }

    }, [url, refreshIndex, requestOptions])


    const refetch = () => {
        setRefreshIndex(prev => prev + 1)
    }


    return { data, loading, error, refetch }

}

export default useFetch