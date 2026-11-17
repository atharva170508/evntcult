/**
 * Turns a generated SVG string (QR codes) into an image source, so it renders through <img>
 * instead of being injected into the DOM as HTML.
 */
export const svgSrc = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
