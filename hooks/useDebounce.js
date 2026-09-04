import { useEffect, useState } from "react"

// Returns a copy of `value` that only updates after `delay` ms of no changes.
// Used to throttle search-as-you-type so we don't fire a request per keystroke.
const useDebounce = (value, delay = 300) => {
    const [debounced, setDebounced] = useState(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])

    return debounced
}

export default useDebounce
