"use client";

import { useEffect, useRef, useState } from "react";

export interface PickedPlace {
  venue: string;
  placeId: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
}

/* Only the parts of the Google Places library this file uses, so no extra package is needed. */
interface Prediction {
  placeId: string;
  text: { text: string };
  toPlace(): {
    fetchFields(o: { fields: string[] }): Promise<unknown>;
    displayName?: string;
    formattedAddress?: string;
    location?: { lat(): number; lng(): number };
  };
}
interface PlacesLibrary {
  AutocompleteSessionToken: new () => object;
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions(r: { input: string; sessionToken: object; includedRegionCodes: string[] }): Promise<{ suggestions: { placePrediction: Prediction | null }[] }>;
  };
}
type MapsWindow = Window & { google?: { maps?: { importLibrary?: (n: string) => Promise<unknown> } } };

let loading: Promise<void> | null = null;

/** Loads Google's script once, the first time someone types in the venue box. */
function loadMaps(key: string): Promise<void> {
  if ((window as MapsWindow).google?.maps?.importLibrary) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&loading=async&v=weekly`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("maps script failed"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

async function places(key: string): Promise<PlacesLibrary> {
  await loadMaps(key);
  return (await (window as MapsWindow).google!.maps!.importLibrary!("places")) as PlacesLibrary;
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * The ordinary venue text box, with place suggestions when a Google key is set.
 * Without a key, or if Google fails, it is just a text box.
 */
export function VenueInput({ apiKey, value, onText, onPick, inputProps }: { apiKey: string | null; value: string; onText: (v: string) => void; onPick: (p: PickedPlace) => void; inputProps: InputProps }) {
  const [items, setItems] = useState<Prediction[]>([]);
  const [active, setActive] = useState(-1);
  const token = useRef<object | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const request = useRef(0);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function suggest(text: string) {
    if (timer.current) clearTimeout(timer.current);
    const mine = ++request.current;
    if (!apiKey || text.trim().length < 3) return setItems([]);
    timer.current = setTimeout(async () => {
      try {
        const lib = await places(apiKey);
        token.current ??= new lib.AutocompleteSessionToken();
        const { suggestions } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({ input: text, sessionToken: token.current, includedRegionCodes: ["in"] });
        if (mine !== request.current) return;
        setItems(suggestions.map((s) => s.placePrediction).filter((p): p is Prediction => !!p).slice(0, 5));
        setActive(-1);
      } catch {
        setItems([]); // Suggestions are a bonus. The typed venue still saves.
      }
    }, 250);
  }

  async function pick(p: Prediction) {
    request.current++;
    setItems([]);
    token.current = null;
    try {
      const place = p.toPlace();
      await place.fetchFields({ fields: ["displayName", "formattedAddress", "location"] });
      onPick({ venue: place.displayName || p.text.text, placeId: p.placeId, lat: place.location?.lat() ?? null, lng: place.location?.lng() ?? null, address: place.formattedAddress ?? null });
    } catch {
      onPick({ venue: p.text.text, placeId: p.placeId, lat: null, lng: null, address: p.text.text });
    }
  }

  return (
    <div className="o-venue">
      <input
        {...inputProps}
        role={items.length ? "combobox" : undefined}
        aria-expanded={items.length ? true : undefined}
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onText(e.target.value);
          suggest(e.target.value);
        }}
        onBlur={() => setTimeout(() => setItems([]), 120)}
        onKeyDown={(e) => {
          if (!items.length) return;
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            const step = e.key === "ArrowDown" ? 1 : -1;
            setActive((a) => (a + step + items.length) % items.length);
          } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            void pick(items[active]);
          } else if (e.key === "Escape") setItems([]);
        }}
      />
      {items.length > 0 && (
        <ul className="o-suggest" role="listbox">
          {items.map((p, i) => (
            <li key={p.placeId} role="option" aria-selected={i === active}>
              <button type="button" className={i === active ? "active" : ""} onMouseDown={(e) => e.preventDefault()} onClick={() => void pick(p)}>
                {p.text.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
