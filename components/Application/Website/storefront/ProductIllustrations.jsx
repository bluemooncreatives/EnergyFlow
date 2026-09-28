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

export const GheeJar = ({ className }) => {
    const uid = useSvgId()
    return (
    <svg {...svgProps} className={className}>
        <defs>
            <linearGradient id={`ghee-fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#F7CF6B" />
                <stop offset="1" stopColor="#E3A33A" />
            </linearGradient>
            <linearGradient id={`ghee-glass-${uid}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#fff" stopOpacity=".55" />
                <stop offset=".35" stopColor="#fff" stopOpacity=".15" />
                <stop offset="1" stopColor="#fff" stopOpacity=".35" />
            </linearGradient>
        </defs>
        <ellipse cx="100" cy="182" rx="62" ry="8" fill="#0A2F24" opacity=".12" />
        {/* jar */}
        <rect x="46" y="58" width="108" height="122" rx="26" fill="#FFF6E2" />
        <path d="M46 96h108v58c0 14.4-11.6 26-26 26H72c-14.4 0-26-11.6-26-26z" fill={`url(#ghee-fill-${uid})`} />
        {/* granules — bilona ghee is grainy */}
        {[[64, 128], [80, 150], [98, 134], [118, 158], [136, 126], [128, 144], [72, 164], [110, 116], [90, 168], [142, 162]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" fill="#FBE2A0" opacity=".9" />
        ))}
        <rect x="46" y="58" width="108" height="122" rx="26" fill={`url(#ghee-glass-${uid})`} />
        <rect x="56" y="70" width="10" height="92" rx="5" fill="#fff" opacity=".45" />
        {/* lid */}
        <rect x="52" y="34" width="96" height="30" rx="9" fill="#0B3D2E" />
        <rect x="52" y="52" width="96" height="6" fill="#072A20" />
        <rect x="60" y="40" width="30" height="5" rx="2.5" fill="#fff" opacity=".18" />
        {/* label */}
        <rect x="66" y="104" width="68" height="44" rx="10" fill="#FFFDF7" />
        <path d="M100 113c5 3 7 8 5 13-5-1-8-5-8-10-3 4-3 8 0 12-6-2-8-8-5-13 2-2 5-3 8-2z" fill="#4E8A5C" />
        <rect x="80" y="133" width="40" height="4" rx="2" fill="#0B3D2E" opacity=".75" />
        <rect x="87" y="140" width="26" height="3" rx="1.5" fill="#0B3D2E" opacity=".35" />
    </svg>
    )
}

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

export const ChocolateBox = ({ className }) => (
    <svg {...svgProps} className={className}>
        <ellipse cx="100" cy="182" rx="74" ry="8" fill="#0A2F24" opacity=".12" />
        {/* box */}
        <rect x="30" y="78" width="140" height="98" rx="14" fill="#5B3321" />
        <rect x="30" y="78" width="140" height="22" rx="10" fill="#6E4029" />
        {/* ribbon */}
        <rect x="92" y="78" width="16" height="98" fill="#F2C94C" />
        <rect x="30" y="112" width="140" height="14" fill="#F2C94C" />
        <rect x="92" y="78" width="6" height="98" fill="#fff" opacity=".22" />
        {/* bow */}
        <path d="M100 78c-10-22-40-26-40-10 0 12 22 14 40 10z" fill="#F2C94C" />
        <path d="M100 78c10-22 40-26 40-10 0 12-22 14-40 10z" fill="#E3A33A" />
        <circle cx="100" cy="77" r="8" fill="#D9962E" />
        {/* truffles in front */}
        {[[58, 166, '#3E2216'], [100, 170, '#4A2A1B'], [142, 166, '#2F1911']].map(([x, y, fill]) => (
            <g key={x}>
                <circle cx={x} cy={y} r="18" fill={fill} />
                <path d={`M${x - 12} ${y - 6}c6 4 10-4 16 0s8-2 10 0`} stroke="#F6E4D2" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <circle cx={x - 6} cy={y - 9} r="3" fill="#fff" opacity=".18" />
            </g>
        ))}
    </svg>
)
