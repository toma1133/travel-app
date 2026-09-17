import { useEffect, useState } from "react";

/**
 * Custom hook to listen to a CSS media query (e.g. "(min-width: 1024px)")
 * Dynamically updates when window resizes or device orientation changes.
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            return window.matchMedia(query).matches;
        }
        return false;
    });

    useEffect(() => {
        if (typeof window === "undefined") return;

        const media = window.matchMedia(query);
        setMatches(media.matches);

        const listener = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        if (media.addEventListener) {
            media.addEventListener("change", listener);
            return () => media.removeEventListener("change", listener);
        } else {
            // Deprecated fallback for older browsers
            media.addListener(listener);
            return () => media.removeListener(listener);
        }
    }, [query]);

    return matches;
}

export default useMediaQuery;
