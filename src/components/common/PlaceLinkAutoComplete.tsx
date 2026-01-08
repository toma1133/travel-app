import React, {
    useState,
    useEffect,
    useRef,
    ChangeEventHandler,
    ChangeEvent,
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

    const { data: allPlaces } = usePlaces(tripId);
    const { data: searchResults, isLoading: isSearching } = usePlaces(
        tripId,
        searchTerm
    );

    // 判斷目前顯示的建議列表
    const suggestions = searchTerm ? searchResults : [];

    // 找出目前已選中的地點資訊 (用於預覽)
    const selectedPlace = allPlaces?.find((p) => p.id === value);

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
    };

    // 初始化：如果原本就有 value，將 searchTerm 設為該 ID
    useEffect(() => {
        if (value && !searchTerm) {
            setSearchTerm(value);
        }
    }, [value]);

    return (
        <div className="relative mb-4" ref={wrapperRef}>
            <div className="relative">
                <input
                    name="link_id"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    placeholder="輸入地點名稱搜尋 或 貼上 ID..."
                    className="w-full bg-transparent border-b border-gray-300 py-2 pl-2 pr-8 outline-none font-mono text-base resize-none transition-colors focus:border-blue-500"
                    autoComplete="off"
                />

                <div className="absolute right-0 top-2 text-gray-400">
                    {isSearching ? (
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

            {selectedPlace && (
                <div className="mt-2 text-xs bg-blue-50 text-blue-700 p-2 rounded flex items-center border border-blue-100">
                    <MapPin size={12} className="mr-2 flex-shrink-0" />
                    <div>
                        <span className="font-bold mr-1">已連結:</span>
                        {selectedPlace.name}
                    </div>
                </div>
            )}

            {!selectedPlace && searchTerm && searchTerm !== value && (
                <p className="text-xs text-gray-400 mt-1">
                    若未選擇建議項目，將直接使用輸入內容作為 ID。
                </p>
            )}

            {isOpen && suggestions && suggestions.length > 0 && (
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
                suggestions?.length === 0 &&
                !isSearching && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white shadow-lg rounded-md border border-gray-100 p-3 text-center text-xs text-gray-400">
                        找不到相關地點
                    </div>
                )}
        </div>
    );
};

export default PlaceLinkAutocomplete;
