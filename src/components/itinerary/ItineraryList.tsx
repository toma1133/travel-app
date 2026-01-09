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
    const hasScrolledRef = useRef(false);

    useEffect(() => {
        if (isPrinting || !Array.isArray(itinerarys) || itinerarys.length === 0)
            return;

        // 如果已經定位過，就不再重置 (避免切換編輯模式時亂跳)
        if (hasScrolledRef.current) return;

        const today = moment().format("YYYY-MM-DD");

        // 找看看有沒有「今天」的行程
        const todayItineraryIndex = itinerarys.findIndex(
            (day) => day.date === today
        );

        let targetDayNum = 1; // 預設第 1 天
        let scrollIndex = 0;

        if (todayItineraryIndex !== -1) {
            // 如果有今天，就展開今天
            targetDayNum = itinerarys[todayItineraryIndex].day_number;
            scrollIndex = todayItineraryIndex;
        } else {
            // 如果沒有今天，預設展開第 1 天
            targetDayNum = itinerarys[0].day_number;
            scrollIndex = 0;
        }

        setExpandedDayNum(targetDayNum);

        // [功能 2 & 3] 執行初始捲動
        // 稍微延遲一點點，確保 DOM 已經渲染完成
        setTimeout(() => {
            if (itemRefs.current[scrollIndex]) {
                itemRefs.current[scrollIndex]?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
                hasScrolledRef.current = true;
            }
        }, 300);
    }, [itinerarys]);

    const handleExpandedBtnClick = (itinerary: ItineraryVM, index: number) => {
        if (isPrinting) return;

        const newDayNum =
            expandedDayNum === itinerary.day_number
                ? null
                : itinerary.day_number;
        setExpandedDayNum(newDayNum);

        // [功能 2] 點擊展開時，捲動到該項目
        if (newDayNum !== null && itemRefs.current[index]) {
            // 這裡不需要 setTimeout，因為點擊時 DOM 已經存在
            itemRefs.current[index]?.scrollIntoView({
                behavior: "smooth",
                block: "start", // 改為 start 讓它貼頂
            });
        }
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
