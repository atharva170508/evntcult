/** Payments are on hold in v1: paid | unpaid, reconciled at the desk. */
export const paymentsEnabled = () => String(process.env.PAYMENTS_ENABLED) === "true";
