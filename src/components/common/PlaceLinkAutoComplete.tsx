import React, {
    useState,
    useEffect,
    useRef,
    ChangeEventHandler,
    ChangeEvent,
    useMemo,
} from "react";
import { Tag, Search, MapPin, XCircle, Loader2 } from "lucide-react";
import usePlaces from "../../hooks/place/UsePlaces";
import type { PlaceVM } from "../../models/types/PlaceTypes";

type PlaceLinkAutocompleteProps = {
    tripId?: string;
    name: string;
    value: string;
    onChange: ChangeEventHandler<HTMLInputElement>;
};

const PlaceLinkAutocomplete: React.FC<PlaceLinkAutocompleteProps> = ({
    tripId,
    name,
    value,
    onChange,
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const { data: allPlaces = [], isLoading } = usePlaces(tripId);

    // 判斷目前顯示的建議列表
    const suggestions = useMemo(() => {
        if (!searchTerm) return []; // 如果沒輸入，不顯示建議 (或視需求改成 return allPlaces)

        const lowerTerm = searchTerm.toLowerCase();
        
        return allPlaces.filter((place) => {
            // 同時搜尋 名稱 與 ID
            return (
                place.name.toLowerCase().includes(lowerTerm) ||
                place.eng_name?.toLowerCase().includes(lowerTerm) ||
                place.id.toLowerCase().includes(lowerTerm)
            );
        });
    }, [allPlaces, searchTerm]);

    // 找出目前已選中的地點資訊 (用於顯示已連結資訊)
    const selectedPlace = useMemo(
        () => allPlaces.find((p) => p.id === value),
        [allPlaces, value]
    );

    // 處理點擊外部關閉下拉選單
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 當 value (外部傳入的 ID) 改變，且資料已載入時，更新輸入框顯示文字
    useEffect(() => {
        if (value && allPlaces.length > 0) {
            const found = allPlaces.find((p) => p.id === value);
            // 如果找得到地點，顯示名稱；找不到則顯示 ID
            const displayText = found ? found.name : value;
            
            // 避免無限迴圈或是打字時被覆蓋，只有在外部 value 改變且不等於當前輸入時才更新
            if (displayText !== searchTerm) {
                 // 標記這是內部更新，不需要觸發搜尋選單
                 setSearchTerm(displayText);
            }
        } else if (!value) {
            setSearchTerm("");
        }
    }, [value, allPlaces]);

    // 輔助函式：建立偽造的 ChangeEvent
    const createSyntheticEvent = (newValue: string) => {
        return {
            target: {
                name: name,
                value: newValue,
            },
            currentTarget: {
                name: name,
                value: newValue,
            },
        } as unknown as ChangeEvent<HTMLInputElement>;
    };

    // 處理輸入變更 (這是真實的 Input Change，直接透傳 Event 即可)
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setSearchTerm(newVal);
        setIsOpen(true);
        onChange(e); // 直接傳遞原始事件
    };

    // 選擇建議項目 (需要偽造 Event)
    const handleSelectPlace = (place: PlaceVM) => {
        const syntheticEvent = createSyntheticEvent(place.id);
        onChange(syntheticEvent);
        setSearchTerm(place.id);
        setIsOpen(false);
    };

    // 清除選取 (需要偽造 Event)
    const handleClear = () => {
        setSearchTerm("");
        const syntheticEvent = createSyntheticEvent("");
        onChange(syntheticEvent);
        setIsOpen(false);
    };

    return (
        <div className="relative mb-4" ref={wrapperRef}>
            <div className="relative">
                <input
                    name={name}
                    value={value}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    placeholder="搜尋地點名稱..."
                    className="w-full bg-transparent border-b border-gray-300 py-2 pl-2 pr-8 outline-none font-mono text-base resize-none transition-colors focus:border-blue-500"
                    autoComplete="off"
                />

                <div className="absolute right-0 top-2 text-gray-400">
                    {isLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : searchTerm ? (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="hover:text-red-500 transition-colors"
                            title="清除"
                        >
                            <XCircle size={16} />
                        </button>
                    ) : (
                        <Search size={16} />
                    )}
                </div>
            </div>

            {/* 顯示已選擇的地點詳情 (當 value 有對應到實際地點時) */}
            {selectedPlace && (
                <div className="mt-2 text-xs bg-blue-50 text-blue-700 p-2 rounded flex items-center border border-blue-100">
                    <MapPin size={12} className="mr-2 flex-shrink-0" />
                    <div>
                        <span className="font-bold mr-1">已連結:</span>
                        {selectedPlace.name}
                    </div>
                </div>
            )}

            {/* 提示：如果輸入的內容不等於已選 ID (代表使用者手動輸入了 ID 或名稱但沒選選單) */}
            {!selectedPlace && searchTerm && searchTerm !== value && (
                <p className="text-xs text-gray-400 mt-1">
                    自訂輸入 ID: {searchTerm}
                </p>
            )}

            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white shadow-lg rounded-md border border-gray-100 max-h-60 overflow-y-auto">
                    <ul>
                        {suggestions.map((place) => (
                            <li
                                key={place.id}
                                onClick={() => handleSelectPlace(place)}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 flex flex-col items-start transition-colors"
                            >
                                <span className="text-sm font-medium text-gray-800">
                                    {place.name}
                                </span>
                                <span className="text-xs text-gray-400 font-mono mt-0.5 truncate w-full">
                                    ID: {place.id}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {isOpen &&
                searchTerm &&
                suggestions.length === 0 &&
                !isLoading && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white shadow-lg rounded-md border border-gray-100 p-3 text-center text-xs text-gray-400">
                        找不到相關地點
                    </div>
                )}
        </div>
    );
};

export default PlaceLinkAutocomplete;
