'use client'
import { Input } from '@/components/ui/input'
import { isValidHex, COLOR_HEX_MAP } from '@/lib/colorMap'
import { normalizeColor } from '@/lib/utils'

// Optional swatch color for a variant. Keeps a native color picker and a hex
// text input in sync, and offers a "use suggested" shortcut when the typed
// color name is in the curated dictionary. Empty value is valid (the storefront
// then falls back to the dictionary / CSS name).
const ColorHexPicker = ({ value = '', onChange, colorName = '' }) => {
    const suggested = COLOR_HEX_MAP[normalizeColor(colorName)?.toLowerCase?.()] || ''
    const pickerValue = isValidHex(value) ? value : (suggested || '#000000')

    return (
        <div className="flex items-center gap-2">
            <input
                type="color"
                aria-label="Pick swatch color"
                value={pickerValue}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1"
            />
            <Input
                type="text"
                placeholder="#50C878 (optional)"
                value={value || ''}
                onChange={(event) => onChange(event.target.value)}
            />
            {!value && suggested && (
                <button
                    type="button"
                    onClick={() => onChange(suggested)}
                    className="shrink-0 whitespace-nowrap rounded-md border border-input px-2 py-2 text-xs text-muted-foreground transition hover:bg-muted"
                >
                    Use {suggested}
                </button>
            )}
        </div>
    )
}

export default ColorHexPicker
