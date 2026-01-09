import { useEffect, useRef, useState } from "react";
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
};

const ItineraryList = ({
    isEditing,
    isPrinting,
    itinerarys,
    theme,
    onAddActivityBtnClick,
    onDeleteActivityBtnClick,
    onDeleteDayBtnClick,
    onEditActivityBtnClick,
    onEditDayBtnClick,
    onViewBtnClick,
}: ItineraryListProps) => {
    const [expandedDayNum, setExpandedDayNum] = useState<number | null>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    // 用來標記是否為「使用者手動點擊」觸發的展開
    // 避免與初始載入的自動捲動邏輯衝突
    const isUserInteractionRef = useRef(false);
    
    // 用來標記初始載入是否完成
    const hasInitialScrolledRef = useRef(false);
    
    // 1. 處理初始載入 (自動捲動到今天)
    useEffect(() => {
        if (isPrinting || !Array.isArray(itinerarys) || itinerarys.length === 0)
            return;

        if (hasInitialScrolledRef.current) return;

        const today = moment().format("YYYY-MM-DD");
        const todayItineraryIndex = itinerarys.findIndex(
            (day) => day.date === today
        );

        let targetDayNum = 1;
        let scrollIndex = 0;

        if (todayItineraryIndex !== -1) {
            targetDayNum = itinerarys[todayItineraryIndex].day_number;
            scrollIndex = todayItineraryIndex;
        } else {
            targetDayNum = itinerarys[0].day_number;
            scrollIndex = 0;
        }

        setExpandedDayNum(targetDayNum);

        // 稍微延遲確保 DOM 渲染完畢
        setTimeout(() => {
            if (itemRefs.current[scrollIndex]) {
                itemRefs.current[scrollIndex]?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
                hasInitialScrolledRef.current = true;
            }
        }, 300);
    }, [itinerarys, isPrinting]);

    // 2. [修正重點] 監聽 expandedDayNum 變化來處理使用者點擊後的捲動
    useEffect(() => {
        // 如果不是使用者點擊 (例如初始載入)，則不執行這裡的捲動，避免衝突
        if (!isUserInteractionRef.current || expandedDayNum === null || !itinerarys) return;

        const index = itinerarys.findIndex(it => it.day_number === expandedDayNum);
        
        if (index !== -1 && itemRefs.current[index]) {
            // 在這裡執行捲動，確保 DOM 已經重新渲染(展開/收合)完畢
            // 使用 setTimeout 0 讓它排在 Event Loop 最後，確保畫面高度已更新
            setTimeout(() => {
                itemRefs.current[index]?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
                // 重置標記
                isUserInteractionRef.current = false; 
            }, 50); // 給一點點緩衝時間讓 CSS transition (如果有) 開始
        }
    }, [expandedDayNum, itinerarys]);

    const handleExpandedBtnClick = (itinerary: ItineraryVM, index: number) => {
        if (isPrinting) return;

        // 標記這是使用者觸發的行為
        isUserInteractionRef.current = true;

        const newDayNum =
            expandedDayNum === itinerary.day_number
                ? null
                : itinerary.day_number;
        
        // 只更新 State，捲動邏輯交給 useEffect
        setExpandedDayNum(newDayNum);
    };

    return (
        <div className={`space-y-4 ${isPrinting ? "space-y-6 px-0" : "px-4"}`}>
            {Array.isArray(itinerarys) && itinerarys.length > 0
                ? itinerarys.map((itinerary, i) => (
                      <div
                          key={i}
                          ref={(el: HTMLDivElement | null) => {
                              itemRefs.current[i] = el;
                          }}
                          className="scroll-mt-20"
                      >
                          <ItineraryItem
                              itinerary={itinerary}
                              theme={theme}
                              isEditing={isEditing}
                              isExpanded={
                                  isPrinting
                                      ? true
                                      : expandedDayNum === itinerary.day_number
                              }
                              isPrinting={isPrinting}
                              onExpandedBtnToggle={() =>
                                  handleExpandedBtnClick(itinerary, i)
                              }
                              onAddActivityBtnClick={onAddActivityBtnClick}
                              onDeleteActivityBtnClick={
                                  onDeleteActivityBtnClick
                              }
                              onDeleteDayBtnClick={onDeleteDayBtnClick}
                              onEditActivityBtnClick={onEditActivityBtnClick}
                              onEditDayBtnClick={onEditDayBtnClick}
                              onViewBtnClick={onViewBtnClick}
                          />
                      </div>
                  ))
                : !isPrinting && (
                      <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300">
                          <p className="text-gray-500">
                              目前沒有任何日程，請點擊上方按鈕開始規劃！
                          </p>
                      </div>
                  )}
        </div>
    );
};

export default ItineraryList;
