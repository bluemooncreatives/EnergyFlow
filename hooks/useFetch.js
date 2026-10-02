import axios from "axios"
import { useEffect, useMemo, useState } from "react"

const useFetch = (url, method = "GET", options = {}) => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    // HTTP status of the last failure (e.g. 404), so callers can tell a
    // missing record apart from a failed request.
    const [errorStatus, setErrorStatus] = useState(null)
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
            setErrorStatus(null)
            try {
                const { data: response } = await axios({
                    url,
                    method,
                    signal: controller.signal,
                    ...(requestOptions)
                })

                if (!response.success) {
                    const failure = new Error(response.message)
                    failure.statusCode = response.statusCode
                    throw failure
                }

                setData(response)
            } catch (error) {
                if (axios.isCancel(error)) {
                    return
                }
                setError(error.response?.data?.message || error.message)
                setErrorStatus(error.statusCode ?? error.response?.data?.statusCode ?? error.response?.status ?? null)
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


    return { data, loading, error, errorStatus, refetch }

}

export default useFetch