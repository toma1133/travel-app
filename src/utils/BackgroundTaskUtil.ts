// Let the first paint and pending input run before starting optional map work.
export function scheduleBackgroundTask(callback: () => void): () => void {
    if (typeof window.requestIdleCallback === "function") {
        const id = window.requestIdleCallback(callback, { timeout: 1500 });
        return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(callback, 150);
    return () => window.clearTimeout(id);
}
