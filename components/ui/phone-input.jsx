"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

/* Common dial codes. Add more here as needed — parsing always matches the
   longest prefix first so overlapping codes (e.g. +1 vs +91) stay correct. */
export const DIAL_CODES = [
    { code: "+91", country: "India" },
    { code: "+92", country: "Pakistan" },
    { code: "+880", country: "Bangladesh" },
    { code: "+977", country: "Nepal" },
    { code: "+94", country: "Sri Lanka" },
    { code: "+975", country: "Bhutan" },
    { code: "+960", country: "Maldives" },
    { code: "+1", country: "USA / Canada" },
    { code: "+44", country: "United Kingdom" },
    { code: "+61", country: "Australia" },
    { code: "+971", country: "UAE" },
    { code: "+966", country: "Saudi Arabia" },
    { code: "+65", country: "Singapore" },
    { code: "+60", country: "Malaysia" },
];

const DEFAULT_CODE = "+91";

/* Split a stored value like "+919876543210" into its dial code + local part.
   Falls back to the default code when no recognised prefix is present so a
   bare 10-digit number still renders sensibly. */
function splitValue(value) {
    const raw = (value ?? "").toString().trim();
    if (!raw) return { dial: DEFAULT_CODE, local: "" };
    if (raw.startsWith("+")) {
        const match = [...DIAL_CODES]
            .sort((a, b) => b.code.length - a.code.length)
            .find((c) => raw.startsWith(c.code));
        if (match) return { dial: match.code, local: raw.slice(match.code.length).trimStart() };
        return { dial: DEFAULT_CODE, local: raw };
    }
    return { dial: DEFAULT_CODE, local: raw };
}

/**
 * Phone field with a country-code prefix selector.
 *
 * The visible <input> keeps whatever `className` you pass it (so the existing
 * field styling is untouched); the country selector is overlaid on the left and
 * the input simply gets extra left padding to make room.
 *
 * `value` is the full string ("+919876543210") and `onChange` receives the same
 * combined string — drop-in compatible with react-hook-form `field.onChange`.
 *
 * @param {boolean} native  render a plain <input> instead of the shadcn Input
 * @param {string}  codeOffset  left padding of the code selector
 * @param {string}  inputOffset left padding applied to the input
 */
function PhoneInput({
    value,
    onChange,
    native = false,
    className,
    style,
    disabled,
    codeOffset = "0.75rem",
    inputOffset = "4.25rem",
    ...props
}) {
    const { dial, local } = splitValue(value);

    // Measure the rendered code+caret so the input's left padding always clears
    // it exactly — no magic numbers, works for any code length (+1 … +880).
    const codeRef = useRef(null);
    const [codeWidth, setCodeWidth] = useState(null);
    useEffect(() => {
        if (codeRef.current) setCodeWidth(codeRef.current.offsetWidth);
    }, [dial]);

    const padLeft = codeWidth != null ? `${codeWidth}px` : inputOffset;

    const emit = (nextDial, nextLocal) => {
        const trimmed = (nextLocal ?? "").trim();
        // Emit empty when there's no number so `required` validation still fires
        // (we never want to store a lone dial code).
        onChange?.(trimmed ? `${nextDial}${trimmed}` : "");
    };

    const inputProps = {
        ...props,
        type: "tel",
        inputMode: "numeric",
        autoComplete: "tel",
        value: local,
        disabled,
        onChange: (e) => emit(dial, e.target.value),
        className,
        style: { paddingLeft: padLeft, ...style },
    };

    return (
        <div className="relative w-full">
            {/* Visible code + caret. Non-interactive so it never steals clicks;
                its measured width drives the input padding (see effect above).
                Right padding here is the gap between the code and the number. */}
            <div
                ref={codeRef}
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 z-[2] flex h-full items-center gap-1"
                style={{ font: "inherit", color: "inherit", paddingLeft: codeOffset, paddingRight: "0.5rem" }}
            >
                <span>{dial}</span>
                <svg width="9" height="9" viewBox="0 0 10 6" fill="none" className="opacity-60">
                    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            {/* Transparent native select layered over the code area only. */}
            <select
                aria-label="Country dialing code"
                value={dial}
                disabled={disabled}
                onChange={(e) => emit(e.target.value, local)}
                className="absolute left-0 top-0 z-[3] h-full cursor-pointer disabled:cursor-not-allowed"
                style={{ width: padLeft, opacity: 0 }}
            >
                {DIAL_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                        {c.code} ({c.country})
                    </option>
                ))}
            </select>
            {native ? <input {...inputProps} /> : <Input {...inputProps} />}
        </div>
    );
}

export { PhoneInput };
