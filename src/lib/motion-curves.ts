/**
 * Unified EvntCult cinematic motion grammar.
 * Shared across the public landing film, /signin, and tactile signed-in App Mode.
 */
export const QOUT = [0.25, 1, 0.5, 1] as const;
export const COUT = [0.33, 1, 0.68, 1] as const;
export const CIN = [0.32, 0, 0.67, 0] as const;
export const CARD_ZOOM = [0.16, 1, 0.3, 1] as const;

export const QOUT_CSS = "cubic-bezier(.25,1,.5,1)";
export const COUT_CSS = "cubic-bezier(.33,1,.68,1)";
export const CIN_CSS = "cubic-bezier(.32,0,.67,0)";
export const CARD_ZOOM_CSS = "cubic-bezier(.16,1,.3,1)";

/** Standard scroll-reveal viewport config — crisp once-only trigger. */
export const CINEMA_VIEWPORT = { once: true, amount: 0.2 } as const;
