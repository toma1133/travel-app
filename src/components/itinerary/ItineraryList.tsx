import { useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import moment from "moment";
import { scrollToItineraryDay, updateItineraryScrollSpace } from "../../utils/ItineraryScrollUtil";
import ItineraryItem from "./ItineraryItem";
import type {
    ItineraryActivitiy,
    ItineraryVM,
} from "../../models/types/ItineraryTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";

import type { PlaceVM } from "../../models/types/PlaceTypes";

type ItineraryListProps = {
    isEditing: boolean;
    isPrinting?: boolean;
    itinerarys?: ItineraryVM[];
    pcSelectedDayId?: string;
    itineraryPlacesMap?: Record<string, PlaceVM[]>;
    placeMap?: Record<string, PlaceVM>;
    scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
    theme: TripThemeConf | null;
    onAddActivityBtnClick: (itineraryDay: ItineraryVM) => void;
    onDeleteActivityBtnClick: (
        itineraryDay: ItineraryVM,
        activity: ItineraryActivitiy
    ) => void;
    onDeleteDayBtnClick: (itinerary: ItineraryVM) => void;
    onEditActivityBtnClick: (
        itineraryDay: ItineraryVM,
        activity: ItineraryActivitiy
    ) => void;
    onEditDayBtnClick: (itinerary: ItineraryVM) => void;
    onOptimizeRouteBtnClick?: (itineraryDay: ItineraryVM) => void;
    onOpenMapBtnClick?: (itineraryDay: ItineraryVM) => void;
    onSelectDay?: (dayId: string) => void;
    onLoadDay?: (dayId: string) => void;
    onViewBtnClick: (linkId: string, activity?: ItineraryActivitiy) => void;
    onPlaceHover?: (linkId: string | null, placeIndex?: number | null) => void;
};

const ItineraryList = ({
    isEditing,
    isPrinting = false,
    itinerarys,
    pcSelectedDayId,
    itineraryPlacesMap,
    placeMap,
    scrollContainerRef,
    theme,
    onAddActivityBtnClick,
    onDeleteActivityBtnClick,
    onDeleteDayBtnClick,
    onEditActivityBtnClick,
    onEditDayBtnClick,
    onOptimizeRouteBtnClick,
    onOpenMapBtnClick,
    onSelectDay,
    onLoadDay,
    onViewBtnClick,
    onPlaceHover,
}: ItineraryListProps) => {
    const [expansion, setExpansion] = useState<{ selection?: string; id: string | null }>();
    const expandedDayId = expansion && expansion.selection === pcSelectedDayId
        ? expansion.id
        : pcSelectedDayId && pcSelectedDayId !== "all" ? pcSelectedDayId
        : itinerarys?.find(day => day.date === moment().format("YYYY-MM-DD"))?.id || itinerarys?.[0]?.id || null;
    const listRef = useRef<HTMLDivElement>(null);
    const spacerRef = useRef<HTMLDivElement>(null);
    const alignedDayRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
    const [scrollRequest, setScrollRequest] = useState(0);
    const previousSelection = useRef<string | undefined>(undefined);
    const previousScrollRequest = useRef(0);
    const requestedDayId = useRef<string | null>(null);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Measure after React commits the expanded/collapsed DOM, before paint.
    // Smooth scrolling keeps an obsolete destination when preceding days collapse.
    useLayoutEffect(() => {
        if (isPrinting) return;
        const container = scrollContainerRef?.current;
        if (!container) return;
        const changed = previousSelection.current !== pcSelectedDayId;
        const requested = previousScrollRequest.current !== scrollRequest;
        if (!changed && !requested) {
            if (!isDesktop && spacerRef.current) updateItineraryScrollSpace(container, alignedDayRef.current, spacerRef.current);
            return;
        }
        const targetDayId = requested ? requestedDayId.current : pcSelectedDayId;
        if (isDesktop || targetDayId === "all") {
            alignedDayRef.current = null;
            if (spacerRef.current) spacerRef.current.style.height = isDesktop ? "" : "0px";
            container.scrollTo({ top: 0, behavior: isDesktop ? "smooth" : "instant" });
        } else {
            const index = itinerarys?.findIndex(day => day.id === targetDayId) ?? -1;
            const element = itemRefs.current[index];
            if (!element) return;
            alignedDayRef.current = element;
            scrollToItineraryDay(container, element, spacerRef.current ?? undefined);
        }
        previousSelection.current = pcSelectedDayId;
        previousScrollRequest.current = scrollRequest;
    }, [pcSelectedDayId, isDesktop, isPrinting, scrollRequest, scrollContainerRef, itinerarys, expandedDayId, placeMap]);

    useEffect(() => {
        const container = scrollContainerRef?.current;
        const spacer = spacerRef.current;
        const list = listRef.current;
        if (!container || !spacer || !list || isPrinting) return;
        if (isDesktop) {
            spacer.style.height = "";
            return;
        }
        const updateSpace = () => updateItineraryScrollSpace(container, alignedDayRef.current, spacer);
        updateSpace();
        if (typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(updateSpace);
        observer.observe(container);
        observer.observe(list);
        return () => observer.disconnect();
    }, [scrollContainerRef, isPrinting, isDesktop]);

    const handleExpandedBtnClick = (itinerary: ItineraryVM) => {
        if (isPrinting || isDesktop) return;
        const next = expandedDayId === itinerary.id ? null : itinerary.id;
        requestedDayId.current = itinerary.id;
        setExpansion({ selection: next || pcSelectedDayId, id: next });
        setScrollRequest(request => request + 1);
        if (next) {
            onSelectDay?.(itinerary.id);
        }
    };

    useEffect(() => {
        if (!isDesktop && pcSelectedDayId === "all" && expandedDayId) onLoadDay?.(expandedDayId);
    }, [isDesktop, pcSelectedDayId, expandedDayId, onLoadDay]);

    const dayOffsets = useMemo(() => {
        const offsets: Record<string, number> = {};
        if (pcSelectedDayId !== "all") {
            return offsets;
        }
        let currentOffset = 0;
        itinerarys?.forEach((day) => {
            offsets[day.id] = currentOffset;
            const validCount = itineraryPlacesMap?.[day.id]?.length || 0;
            currentOffset += validCount;
        });
        return offsets;
    }, [itinerarys, pcSelectedDayId, itineraryPlacesMap]);

    return (
        <div ref={listRef} className={`space-y-4 ${isPrinting ? "space-y-6 overflow-visible block" : ""}`}>
            {Array.isArray(itinerarys) && itinerarys.length > 0 ? (
                itinerarys.map((itinerary, i) => !isPrinting && isDesktop && pcSelectedDayId && pcSelectedDayId !== "all" && pcSelectedDayId !== itinerary.id ? null : (
                    <div
                        key={itinerary.id || i}
                        ref={(el: HTMLDivElement | null) => {
                            itemRefs.current[i] = el;
                        }}
                        className={`${
                            isPrinting
                                ? `overflow-visible block ${i > 0 ? "break-before-page" : ""}`
                                : "scroll-mt-0"
                        } ${
                            !isPrinting && pcSelectedDayId && pcSelectedDayId !== "all" && pcSelectedDayId !== itinerary.id 
                                ? "block lg:hidden" 
                                : "block"
                        }`}
                    >
                        <LazyDayContent
                            dayId={itinerary.id}
                            enabled={!isPrinting && isDesktop && pcSelectedDayId === "all"}
                            rootRef={scrollContainerRef}
                            onLoadDay={onLoadDay}
                        >{(ready) => <ItineraryItem
                            itinerary={itinerary}
                            theme={theme}
                            isEditing={isEditing}
                            isExpanded={isPrinting || (isDesktop ? ready : expandedDayId === itinerary.id)}
                            isPrinting={isPrinting}
                            dayPlaceIndexOffset={dayOffsets[itinerary.id] || 0}
                            placeMap={placeMap}
                            onExpandedBtnToggle={() => handleExpandedBtnClick(itinerary)}
                            onAddActivityBtnClick={onAddActivityBtnClick}
                            onDeleteActivityBtnClick={onDeleteActivityBtnClick}
                            onDeleteDayBtnClick={onDeleteDayBtnClick}
                            onEditActivityBtnClick={onEditActivityBtnClick}
                            onEditDayBtnClick={onEditDayBtnClick}
                            onOptimizeRouteBtnClick={onOptimizeRouteBtnClick}
                            onOpenMapBtnClick={onOpenMapBtnClick}
                            onViewBtnClick={onViewBtnClick}
                            onPlaceHover={onPlaceHover}
                        />}</LazyDayContent>
                    </div>
                ))
            ) : (
                !isPrinting && (
                    <div className="text-center py-12 glass-panel rounded-3xl border border-dashed border-black/10 dark:border-white/10 shadow-2xs">
                        <p className="text-muted-foreground text-sm font-medium">
                            目前沒有任何日程，請點擊上方 + 新增按鈕開始規劃！
                        </p>
                    </div>
                )
            )}

            {/* Only add mobile space when the selected header cannot otherwise reach the top. */}
            {!isPrinting && (
                <div ref={spacerRef} className="w-full shrink-0 h-0 lg:h-10 pointer-events-none" aria-hidden="true" />
            )}
        </div>
    );
};

function LazyDayContent({ dayId, enabled, rootRef, onLoadDay, children }: {
    dayId: string;
    enabled: boolean;
    rootRef?: React.RefObject<HTMLDivElement | null>;
    onLoadDay?: (id: string) => void;
    children: (ready: boolean) => React.ReactNode;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [ready, setReady] = useState(false);
    useEffect(() => {
        if (!enabled) return;
        if (ready || typeof IntersectionObserver === "undefined") {
            onLoadDay?.(dayId);
            return;
        }
        const observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) {
                setReady(true);
                onLoadDay?.(dayId);
                observer.disconnect();
            }
        }, { root: rootRef?.current, rootMargin: "240px" });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [enabled, ready, dayId, rootRef, onLoadDay]);
    return <div ref={ref}>{children(!enabled || ready || typeof IntersectionObserver === "undefined")}</div>;
}

export default ItineraryList;
