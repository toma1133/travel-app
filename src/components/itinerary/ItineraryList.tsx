import { useEffect, useRef, useState, useMemo } from "react";
import moment from "moment";
import ItineraryItem from "./ItineraryItem";
import type {
    ItineraryActivitiy,
    ItineraryVM,
} from "../../models/types/ItineraryTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";

type ItineraryListProps = {
    isEditing: boolean;
    isPrinting?: boolean;
    itinerarys?: ItineraryVM[];
    pcSelectedDayId?: string;
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
    onViewBtnClick: (linkId: string) => void;
    onPlaceHover?: (linkId: string | null) => void;
};

const ItineraryList = ({
    isEditing,
    isPrinting = false,
    itinerarys,
    pcSelectedDayId,
    scrollContainerRef,
    theme,
    onAddActivityBtnClick,
    onDeleteActivityBtnClick,
    onDeleteDayBtnClick,
    onEditActivityBtnClick,
    onEditDayBtnClick,
    onViewBtnClick,
    onPlaceHover,
}: ItineraryListProps) => {
    const [expandedDayNum, setExpandedDayNum] = useState<number | null>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
    
    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // 同步外部的選擇狀態與內部的展開狀態
    useEffect(() => {
        if (!Array.isArray(itinerarys)) return;
        if (pcSelectedDayId && pcSelectedDayId !== "all") {
            const day = itinerarys.find(d => d.id === pcSelectedDayId);
            if (day) setExpandedDayNum(day.day_number);
            
            // 在 PC 端點擊天數切換時，滾動到最上方
            if (isDesktop && scrollContainerRef?.current) {
                scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
            }
        } else if (itinerarys.length === 1) {
            setExpandedDayNum(itinerarys[0].day_number);
        } else if (pcSelectedDayId === "all" || !pcSelectedDayId) {
            if (expandedDayNum === null && itinerarys.length > 0) {
                const todayStr = moment().format("YYYY-MM-DD");
                const todayDay = itinerarys.find(d => d.date === todayStr);
                setExpandedDayNum(todayDay ? todayDay.day_number : itinerarys[0].day_number);
            }
            if (isDesktop && pcSelectedDayId === "all" && scrollContainerRef?.current) {
                scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
            }
        }
    }, [itinerarys, pcSelectedDayId, isDesktop]);

    const handleExpandedBtnClick = (itinerary: ItineraryVM, index: number) => {
        if (isPrinting || isDesktop) return;

        const newDayNum =
            expandedDayNum === itinerary.day_number
                ? null
                : itinerary.day_number;
        
        setExpandedDayNum(newDayNum);

        // 手機版點選日程展開時，平滑滾動到該日程頂部
        if (newDayNum !== null) {
            setTimeout(() => {
                const element = itemRefs.current[index];
                if (element) {
                    if (index === 0) {
                        // 第一天直接捲動至最頂部 (scrollTop = 0)
                        const scrollParent = element.closest(".overflow-y-auto") || document.documentElement;
                        scrollParent.scrollTo({ top: 0, behavior: "smooth" });
                    } else {
                        // 其他天數滾動至該項目頂端（配合 scroll-mt-16 對齊導航列下方）
                        element.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                }
            }, 100);
        }
    };

    const activeItinerary = useMemo(() => {
        if (!itinerarys || itinerarys.length === 0) return null;
        return (
            itinerarys.find((day) => day.day_number === expandedDayNum) ||
            itinerarys[0]
        );
    }, [itinerarys, expandedDayNum]);

    return (
        <div className={`space-y-4 ${isPrinting ? "space-y-6 overflow-visible block" : ""}`}>
            {Array.isArray(itinerarys) && itinerarys.length > 0 ? (
                itinerarys.map((itinerary, i) => (
                    <div
                        key={itinerary.id || i}
                        ref={(el: HTMLDivElement | null) => {
                            itemRefs.current[i] = el;
                        }}
                        className={`${isPrinting ? "overflow-visible block break-inside-avoid" : "scroll-mt-16 lg:scroll-mt-0"} ${
                            !isPrinting && pcSelectedDayId && pcSelectedDayId !== "all" && pcSelectedDayId !== itinerary.id 
                                ? "block lg:hidden" 
                                : "block"
                        }`}
                    >
                        <ItineraryItem
                            itinerary={itinerary}
                            theme={theme}
                            isEditing={isEditing}
                            isExpanded={isDesktop || expandedDayNum === itinerary.day_number || isPrinting}
                            isPrinting={isPrinting}
                            onExpandedBtnToggle={() => handleExpandedBtnClick(itinerary, i)}
                            onAddActivityBtnClick={onAddActivityBtnClick}
                            onDeleteActivityBtnClick={onDeleteActivityBtnClick}
                            onDeleteDayBtnClick={onDeleteDayBtnClick}
                            onEditActivityBtnClick={onEditActivityBtnClick}
                            onEditDayBtnClick={onEditDayBtnClick}
                            onViewBtnClick={onViewBtnClick}
                            onPlaceHover={onPlaceHover}
                        />
                    </div>
                ))
            ) : (
                !isPrinting && (
                    <div className="text-center py-10 bg-card rounded-xl border border-dashed border-border/50 shadow-sm">
                        <p className="text-muted-foreground text-sm font-medium">
                            目前沒有任何日程，請點擊上方 + 新增按鈕開始規劃！
                        </p>
                    </div>
                )
            )}
        </div>
    );
};

export default ItineraryList;
