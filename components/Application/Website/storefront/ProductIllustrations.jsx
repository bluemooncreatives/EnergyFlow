import { useId } from 'react'

// Flat, on-brand illustrations for the signature ranges. They stand in until
// real photography exists for these lines (the Signature section swaps to a
// photo as soon as a tile is given an `image`). Purely decorative: aria-hidden.

const svgProps = {
    viewBox: '0 0 200 200',
    'aria-hidden': true,
    focusable: 'false',
    xmlns: 'http://www.w3.org/2000/svg',
}

// Gradient ids are made unique per instance: the same art can render twice on
// a page, and a duplicate id resolving to a hidden copy paints nothing.
const useSvgId = () => useId().replace(/[^a-zA-Z0-9_-]/g, '')

export const OilBottle = ({ className }) => {
    const uid = useSvgId()
    return (
    <svg {...svgProps} className={className}>
        <defs>
            <linearGradient id={`oil-fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#E7C850" />
                <stop offset="1" stopColor="#B99124" />
            </linearGradient>
        </defs>
        <ellipse cx="96" cy="184" rx="50" ry="7" fill="#0A2F24" opacity=".12" />
        {/* bottle */}
        <path d="M84 20h24v30c0 6 4 10 10 16 8 8 12 16 12 28v74c0 9-7 16-16 16H78c-9 0-16-7-16-16V94c0-12 4-20 12-28 6-6 10-10 10-16z" fill="#FFF8E6" />
        <path d="M63 100h66v68c0 9-7 16-16 16H79c-9 0-16-7-16-16z" fill={`url(#oil-fill-${uid})`} />
        <path d="M84 20h24v30c0 6 4 10 10 16 8 8 12 16 12 28v74c0 9-7 16-16 16H78c-9 0-16-7-16-16V94c0-12 4-20 12-28 6-6 10-10 10-16z" fill="none" stroke="#0A2F24" strokeOpacity=".08" strokeWidth="2" />
        <rect x="70" y="92" width="8" height="78" rx="4" fill="#fff" opacity=".4" />
        {/* cap */}
        <rect x="80" y="10" width="32" height="18" rx="5" fill="#0B3D2E" />
        <rect x="80" y="24" width="32" height="4" fill="#072A20" />
        {/* label */}
        <rect x="70" y="118" width="52" height="40" rx="8" fill="#FFFDF7" />
        <circle cx="96" cy="130" r="6" fill="#F2C94C" />
        <rect x="82" y="142" width="28" height="4" rx="2" fill="#0B3D2E" opacity=".75" />
        <rect x="87" y="149" width="18" height="3" rx="1.5" fill="#0B3D2E" opacity=".35" />
        {/* drop + seeds */}
        <path d="M156 118c7 10 11 17 11 22a11 11 0 0 1-22 0c0-5 4-12 11-22z" fill="#E3B53A" />
        <path d="M152 138a5 5 0 0 0 5 5" stroke="#fff" strokeOpacity=".7" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {[[140, 178], [150, 174], [160, 179], [146, 184]].map(([x, y]) => (
            <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="4" ry="2.6" fill="#8B5A1E" transform={`rotate(-20 ${x} ${y})`} />
        ))}
        <path d="M40 150c-8-14-4-30 12-38 2 16-2 28-12 38z" fill="#4E8A5C" />
        <path d="M40 150c2-12 6-22 12-38" stroke="#0B3D2E" strokeWidth="1.5" fill="none" />
    </svg>
    )
}
