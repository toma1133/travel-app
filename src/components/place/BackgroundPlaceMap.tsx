import { Component, lazy, memo, startTransition, Suspense, useDeferredValue, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Loader2, MapPin } from "lucide-react";
import type { PlaceMapViewProps } from "./PlaceMapView";
import { scheduleBackgroundTask } from "../../utils/BackgroundTaskUtil";

const PlaceMapView = lazy(() => import("./PlaceMapView"));

function MapLoading() {
    return <div role="status" className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/30 text-xs text-muted-foreground">
        <Loader2 size={24} className="animate-spin text-primary" aria-hidden="true" />
        <span>地圖載入中，可繼續操作行程</span>
    </div>;
}

class MapErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() {
        if (this.state.failed) {
            return <div role="status" className="h-full flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <MapPin size={24} aria-hidden="true" />
                <span>地圖無法載入，請稍後重新整理。行程仍可正常操作。</span>
            </div>;
        }
        return this.props.children;
    }
}

const DeferredMap = memo(PlaceMapView);

export default function BackgroundPlaceMap(props: PlaceMapViewProps) {
    const [ready, setReady] = useState(false);
    const deferredProps = useDeferredValue(props);
    useEffect(() => scheduleBackgroundTask(() => startTransition(() => setReady(true))), []);

    return <MapErrorBoundary>
        <Suspense fallback={<MapLoading />}>
            {ready ? <DeferredMap {...deferredProps} initialMapStyle="lightweight" /> : <MapLoading />}
        </Suspense>
    </MapErrorBoundary>;
}
