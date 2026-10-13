import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { TileLayer } from "react-leaflet";
import { Loader2, RefreshCw } from "lucide-react";

const MapVectorLayer = lazy(() => import("./MapVectorLayer").then(module => ({ default: module.MapVectorLayer })));

type MapBasemapProps = {
    type: "vector" | "raster";
    url: string;
    attribution: string;
    subdomains?: string;
    maxZoom?: number;
};

export default function MapBasemap(props: MapBasemapProps) {
    const [attempt, setAttempt] = useState(0);
    return <BasemapAttempt key={attempt} {...props} onRetry={() => setAttempt(value => value + 1)} />;
}

function BasemapAttempt({ type, url, attribution, subdomains, maxZoom, onRetry }: MapBasemapProps & { onRetry: () => void }) {
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
    const [slow, setSlow] = useState(false);
    const onReady = useCallback(() => setStatus("ready"), []);
    const onError = useCallback(() => setStatus("error"), []);
    useEffect(() => {
        if (status !== "loading") return;
        const timer = window.setTimeout(() => setSlow(true), 15000);
        return () => window.clearTimeout(timer);
    }, [status]);

    return <>
        {type === "vector" ? <Suspense fallback={null}>
            <MapVectorLayer styleUrl={url} onReady={onReady} onError={onError} />
        </Suspense> : <TileLayer
            url={url} attribution={attribution} subdomains={subdomains || "abc"} maxZoom={maxZoom || 19}
            updateWhenIdle updateWhenZooming={false} keepBuffer={1}
            eventHandlers={{ tileload: onReady, tileerror: onError }}
        />}
        {status !== "ready" && <div className="pointer-events-none absolute bottom-14 left-3 right-3 z-[1000] flex justify-center">
            <div role="status" className="flex items-center gap-2 rounded-xl bg-background/95 px-3 py-2 text-xs text-muted-foreground shadow-md border border-border">
                {status === "loading" && <Loader2 size={14} className="animate-spin text-primary shrink-0" aria-hidden="true" />}
                <span>{status === "error" ? "部分底圖無法載入" : slow ? "網路較慢，地圖仍在載入中" : "底圖載入中…"}</span>
                {(slow || status === "error") && <button type="button" onClick={onRetry} className="pointer-events-auto flex items-center gap-1 text-primary cursor-pointer shrink-0">
                    <RefreshCw size={12} aria-hidden="true" />重試
                </button>}
            </div>
        </div>}
    </>;
}
