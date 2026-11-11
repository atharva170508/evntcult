/** Money is stored as integer paise. Format for display in INR. */
/** A sum of money (totals, collected, to collect): zero is ₹0, never "Free". */
export function formatAmount(paise: number): string {
  return paise === 0 ? "₹0" : formatINR(paise);
}

/** A price on a ticket: zero reads as "Free". */
export function formatINR(paise: number): string {
  if (paise === 0) return "Free";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);
}

/**
 * Standard UPI deep link (NPCI spec). Rendered as a QR for scan-to-pay.
 * Payments are on hold — this only builds the string; nothing is charged.
 */
export function upiUri(opts: { vpa: string; payeeName: string; amountPaise: number; note: string; ref?: string }) {
  const params = new URLSearchParams({
    pa: opts.vpa,
    pn: opts.payeeName,
    am: (opts.amountPaise / 100).toFixed(2),
    cu: "INR",
    tn: opts.note.slice(0, 80),
  });
  if (opts.ref) params.set("tr", opts.ref);
  return `upi://pay?${params.toString()}`;
}
