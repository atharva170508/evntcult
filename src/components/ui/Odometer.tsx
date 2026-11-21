/**
 * Rolling digits. Each digit is a column of 0–9 moved with transform, so a change in value
 * rolls like an odometer (transform only, no layout). Works in server and client components:
 * when a refresh changes the value, React patches the transform and CSS animates it.
 * Screen readers get the plain number.
 */
export function Odometer({ value, locale = "en-IN", className }: { value: number; locale?: string; className?: string }) {
  const text = value.toLocaleString(locale);
  return (
    <span className={`odo ${className ?? ""}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-flex">
        {[...text].map((ch, i) =>
          /\d/.test(ch) ? (
            // Keyed from the right, so digits keep their column as the number grows.
            <span key={`d${text.length - i}`} className="odo-col">
              <span className="odo-strip" style={{ transform: `translateY(-${Number(ch) * 10}%)` }}>
                {DIGITS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </span>
            </span>
          ) : (
            <span key={`s${text.length - i}`}>{ch}</span>
          ),
        )}
      </span>
    </span>
  );
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
