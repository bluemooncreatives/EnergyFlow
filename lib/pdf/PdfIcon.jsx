import { Svg, Path, Circle, Rect, Line, Polyline, Polygon, Ellipse, G } from '@react-pdf/renderer'

/**
 * Draws a react-icons icon with @react-pdf/renderer primitives.
 *
 * react-icons components return DOM <svg> elements, which react-pdf cannot
 * render. Calling the icon gives back its element tree (an IconBase carrying
 * the root <svg> attributes, plus plain path/circle/... children), so we walk
 * that tree and rebuild it with react-pdf's Svg primitives.
 *
 * Usage: <PdfIcon icon={FiPhone} size={9} color="#0B3D2E" />
 */

const PRIMITIVES = { path: Path, circle: Circle, rect: Rect, line: Line, polyline: Polyline, polygon: Polygon, ellipse: Ellipse, g: G }

// Root-level paint attributes; pushed down to every shape because react-pdf
// does not reliably inherit them from <Svg>.
const PAINT_KEYS = ['fill', 'stroke', 'strokeWidth', 'strokeLinecap', 'strokeLinejoin']

const paint = (value, color) => (value === 'currentColor' ? color : value)

const toPdf = (node, inherited, color, key) => {
    if (!node || typeof node !== 'object') return null
    const Primitive = PRIMITIVES[node.type]
    if (!Primitive) return null

    const { children, ...attrs } = node.props || {}
    const props = { ...inherited, ...attrs }
    for (const k of ['fill', 'stroke']) if (props[k]) props[k] = paint(props[k], color)
    // react-icons fills solid shapes implicitly; make that explicit for PDF.
    if (!props.fill && !props.stroke) props.fill = color

    const kids = [].concat(children || []).map((child, i) => toPdf(child, inherited, color, i))
    return <Primitive key={key} {...props}>{kids.length ? kids : undefined}</Primitive>
}

const PdfIcon = ({ icon: Icon, size = 10, color = '#0B3D2E', style }) => {
    const root = Icon({})
    const attr = root?.props?.attr || {}
    const inherited = Object.fromEntries(PAINT_KEYS.filter((k) => attr[k] !== undefined).map((k) => [k, attr[k]]))
    if (!inherited.fill && !inherited.stroke) inherited.fill = 'currentColor'

    return (
        <Svg viewBox={attr.viewBox || '0 0 24 24'} width={size} height={size} style={style}>
            {[].concat(root?.props?.children || []).map((child, i) => toPdf(child, inherited, color, i))}
        </Svg>
    )
}

export default PdfIcon
