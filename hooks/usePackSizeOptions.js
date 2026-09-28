import { useCallback, useMemo, useState } from "react"
import useFetch from "@/hooks/useFetch"
import { normalizePackSize, sizes as presetSizes, sortSizes } from "@/lib/utils"

// Pack-size options for the variant forms: the preset list, every size already
// saved on a variant (so custom sizes come back next time), anything typed in
// this session, and the value currently on the form (edit page).
const usePackSizeOptions = (currentValue) => {
    const { data: savedSizes } = useFetch('/api/product-variant/sizes?fresh=1')
    const [added, setAdded] = useState([])

    const options = useMemo(() => {
        const labels = [
            ...presetSizes.map((size) => size.value),
            ...(savedSizes?.success && Array.isArray(savedSizes.data) ? savedSizes.data : []),
            ...added,
            ...(currentValue ? [currentValue] : []),
        ]

        const seen = new Map()
        for (const label of labels) {
            const key = String(label).toLowerCase()
            if (label && !seen.has(key)) seen.set(key, label)
        }

        return sortSizes([...seen.values()]).map((label) => ({ label, value: label }))
    }, [savedSizes, added, currentValue])

    // Returns the option to select: an existing one when the typed value only
    // differs by spacing/case, otherwise a newly added one.
    const addOption = useCallback((input) => {
        const label = normalizePackSize(input)
        if (!label) return null

        const existing = options.find((option) => option.value.toLowerCase() === label.toLowerCase())
        if (existing) return existing

        setAdded((prev) => [...prev, label])
        return { label, value: label }
    }, [options])

    return { options, addOption }
}

export default usePackSizeOptions
