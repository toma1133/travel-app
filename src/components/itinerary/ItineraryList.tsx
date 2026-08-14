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

    // 用來標記是否為「使用者手動點擊」觸發的展開
    // 避免與初始載入的自動捲動邏輯衝突
    const isUserInteractionRef = useRef(false);
    
    // 用來標記初始載入是否完成
    const hasInitialScrolledRef = useRef(false);
    
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
    }, [itinerarys, pcSelectedDayId]);

    // 初始載入時，自動捲動到展開的日期
    useEffect(() => {
        if (!hasInitialScrolledRef.current && expandedDayNum !== null && !isDesktop && Array.isArray(itinerarys)) {
            const index = itinerarys.findIndex(d => d.day_number === expandedDayNum);
            if (index >= 0) {
                const element = itemRefs.current[index];
                if (element) {
                    hasInitialScrolledRef.current = true;
                    setTimeout(() => {
                        element.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 300);
                }
            }
        }
    }, [expandedDayNum, itinerarys, isDesktop]);

    const handleExpandedBtnClick = (itinerary: ItineraryVM, index: number) => {
        if (isPrinting || isDesktop) return;

        // 標記這是使用者觸發的行為
        isUserInteractionRef.current = true;

        const newDayNum =
            expandedDayNum === itinerary.day_number
                ? null
                : itinerary.day_number;
        
        // 只更新 State，捲動邏輯交給 useEffect
        setExpandedDayNum(newDayNum);

        // 手機版點擊展開後自動滾動到該項目頂部
        if (newDayNum !== null) {
            setTimeout(() => {
                const element = itemRefs.current[index];
                if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }, 150);
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
        <div className={`space-y-4 ${isPrinting ? "space-y-6" : ""}`}>
            {Array.isArray(itinerarys) && itinerarys.length > 0 ? (
                <div className="space-y-4">
                    {itinerarys.map((itinerary, i) => (
                        <div
                            key={itinerary.id || i}
                            ref={(el: HTMLDivElement | null) => {
                                itemRefs.current[i] = el;
                            }}
                            className={`scroll-mt-[60px] lg:scroll-mt-0 ${
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
                    ))}
                </div>
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
