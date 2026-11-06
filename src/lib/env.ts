/** True when the app should run on mock data with no DB / auth. */
export const isDemoMode = () => process.env.DEMO_MODE === "true";

export const paymentsEnabled = () => process.env.PAYMENTS_ENABLED === "true";
