import { useMemo } from "react";
import { Plus } from "lucide-react";
import type { ItineraryActivitiy, ItineraryVM } from "../../models/types/ItineraryTypes";
import { computeDayTimelineSchedule, getTimelineConnection } from "../../utils/ItineraryTimeUtil";
import type { TripThemeConf } from "../../models/types/TripTypes";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import useTripPlacesBatch from "../../hooks/place/UseTripPlacesBatch";
import ItineraryDayHeader from "./timeline/ItineraryDayHeader";
import ActivityTimelineCard from "./timeline/ActivityTimelineCard";
import TransitConnectorNode from "./timeline/TransitConnectorNode";

type ItineraryItemProps = {
    itinerary: ItineraryVM;
    isEditing: boolean;
    isExpanded: boolean;
    isPrinting?: boolean;
    dayPlaceIndexOffset?: number;
    placeMap?: Record<string, PlaceVM>;
    theme: TripThemeConf | null;
    onAddActivityBtnClick: (itineraryDay: ItineraryVM) => void;
    onDeleteActivityBtnClick: (itineraryDay: ItineraryVM, activity: ItineraryActivitiy) => void;
    onDeleteDayBtnClick: (itinerary: ItineraryVM) => void;
    onEditActivityBtnClick: (itineraryDay: ItineraryVM, activity: ItineraryActivitiy) => void;
    onEditDayBtnClick: (itinerary: ItineraryVM) => void;
    onExpandedBtnToggle: (itinerary: ItineraryVM) => void;
    onOptimizeRouteBtnClick?: (itineraryDay: ItineraryVM) => void;
    onOpenMapBtnClick?: (itineraryDay: ItineraryVM) => void;
    onViewBtnClick: (linkId: string, activity?: ItineraryActivitiy) => void;
    onPlaceHover?: (linkId: string | null, placeIndex?: number | null) => void;
};

const ItineraryItem = ({
    itinerary,
    isEditing,
    isExpanded,
    isPrinting = false,
    dayPlaceIndexOffset = 0,
    placeMap: externalPlaceMap,
    theme,
    onAddActivityBtnClick,
    onDeleteActivityBtnClick,
    onDeleteDayBtnClick,
    onEditActivityBtnClick,
    onEditDayBtnClick,
    onExpandedBtnToggle,
    onOptimizeRouteBtnClick,
    onOpenMapBtnClick,
    onViewBtnClick,
    onPlaceHover,
}: ItineraryItemProps) => {
    const activityLinkIds = useMemo(() => {
        return (itinerary.activities || []).map((a) => a.linkId).filter(Boolean) as string[];
    }, [itinerary.activities]);

    const hasExternalMap = externalPlaceMap !== undefined;
    const { placeMap: fallbackPlaceMap } = useTripPlacesBatch(itinerary.trip_id, hasExternalMap || (!isExpanded && !isPrinting) ? [] : activityLinkIds);
    const placeMap = hasExternalMap ? externalPlaceMap! : fallbackPlaceMap;

    const weatherCoordinates = useMemo(() => {
        let lat = 0, lng = 0;
        let hasCoordinates = false;
        if (Array.isArray(itinerary.activities)) {
            for (const act of itinerary.activities) {
                if (act.linkId && placeMap[act.linkId]) {
                    const p = placeMap[act.linkId];
                    if (typeof p.lat === "number" && typeof p.lng === "number" && !isNaN(p.lat) && !isNaN(p.lng)) {
                        lat = p.lat; lng = p.lng; hasCoordinates = true; break;
                    }
                }
            }
        }
        return { lat, lng, hasCoordinates };
    }, [itinerary.activities, placeMap]);

    const scheduleList = useMemo(() => {
        return (isExpanded || isPrinting) && Array.isArray(itinerary.activities) ? computeDayTimelineSchedule(itinerary.activities, itinerary) : [];
    }, [itinerary, isExpanded, isPrinting]);

    return (
        <div className={`group relative transition-all duration-300 ${!isPrinting ? "glass-panel rounded-3xl mb-4 lg:mb-5 overflow-hidden" : "bg-white border-b-2 border-black pb-4 mb-6 overflow-visible block"}`}>
            <ItineraryDayHeader
                itinerary={itinerary} theme={theme} isEditing={isEditing} isExpanded={isExpanded} isPrinting={isPrinting} weatherCoordinates={weatherCoordinates}
                onToggleExpand={() => onExpandedBtnToggle(itinerary)} onOptimizeRoute={onOptimizeRouteBtnClick} onOpenMap={onOpenMapBtnClick}
                onEditDay={onEditDayBtnClick} onDeleteDay={onDeleteDayBtnClick} onAddActivity={onAddActivityBtnClick}
            />

            {(isExpanded || isPrinting) && (
                <div className={`relative px-2 sm:px-4 ${isPrinting ? "pt-2 pb-2 overflow-visible block" : "py-4 overflow-hidden"}`}>
                    <div className="absolute top-0 bottom-4 left-2 sm:left-4 w-12 sm:w-14 flex justify-center pointer-events-none">
                        <div className={`w-[1.5px] h-full ${!isPrinting ? "bg-black/[0.08] dark:bg-white/[0.12]" : "bg-gray-400"}`} />
                    </div>

                    <div className={isPrinting ? "space-y-2" : "space-y-1.5"}>
                        {scheduleList.length > 0 ? (
                            scheduleList.map((item, scheduleIdx) => {
                                const { activity, index: idx, startTime, hasStayDuration, durationFormatted, transit } = item;
                                const linkedPlace = activity.linkId ? placeMap[activity.linkId] : null;

                                const nextItem = scheduleList[scheduleIdx + 1];
                                const connection = getTimelineConnection(item, nextItem);
                                const delayMinutes = connection.delayMinutes;
                                const isLateConflict = delayMinutes > 0;

                                const prevItem = scheduleIdx > 0 ? scheduleList[scheduleIdx - 1] : null;
                                const delayFromPrevMinutes = prevItem ? getTimelineConnection(prevItem, item).delayMinutes : 0;
                                const isDelayedFromPrev = delayFromPrevMinutes > 0;
                                const freeGapMinutes = connection.gapMinutes;

                                const hasGps = !!(linkedPlace && typeof linkedPlace.lat === "number" && typeof linkedPlace.lng === "number" && !isNaN(linkedPlace.lat) && !isNaN(linkedPlace.lng));
                                const placeIndexInDay = hasGps
                                    ? (itinerary.activities?.slice(0, idx).filter((a) => {
                                          const p = a.linkId ? placeMap[a.linkId] : null;
                                          return p && typeof p.lat === "number" && typeof p.lng === "number" && !isNaN(p.lat) && !isNaN(p.lng);
                                      }).length ?? 0)
                                    : null;
                                const currentPlaceIndex = placeIndexInDay !== null ? dayPlaceIndexOffset + placeIndexInDay : null;

                                return (
                                    <div key={idx} className="space-y-1.5">
                                        <ActivityTimelineCard
                                            itineraryDay={itinerary} activity={activity} activityIndex={idx} startTime={startTime}
                                            hasStayDuration={hasStayDuration} durationFormatted={durationFormatted} linkedPlace={linkedPlace}
                                            theme={theme} isEditing={isEditing} isPrinting={isPrinting} isDelayedFromPrev={isDelayedFromPrev}
                                            delayFromPrevMinutes={delayFromPrevMinutes} prevArrivalTime={prevItem?.transit?.arrivalTime}
                                            currentPlaceIndex={currentPlaceIndex} onViewClick={onViewBtnClick} onEditClick={onEditActivityBtnClick}
                                            onDeleteClick={onDeleteActivityBtnClick} onPlaceHover={onPlaceHover}
                                        />
                                        <TransitConnectorNode
                                            transit={transit} transitDetails={activity.transitDetails} isLateConflict={isLateConflict}
                                            delayMinutes={delayMinutes} freeGapMinutes={freeGapMinutes} isPrinting={isPrinting}
                                        />
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex py-3">
                                <div className="w-12 sm:w-14 shrink-0" />
                                <p className="text-xs text-muted-foreground italic">尚無活動，點擊「新增活動」加入景點</p>
                            </div>
                        )}

                        {!isPrinting && (
                            <div className="flex pt-1 pb-1">
                                <div className="w-12 sm:w-14 shrink-0" />
                                <button
                                    type="button"
                                    onClick={() => onAddActivityBtnClick(itinerary)}
                                    className="flex-1 mr-1 sm:mr-2 py-2 rounded-2xl border border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
                                >
                                    <Plus size={13} />
                                    <span>加入新行程活動</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItineraryItem;
