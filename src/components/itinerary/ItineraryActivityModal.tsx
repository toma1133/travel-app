import {
    ChangeEventHandler,
    ChangeEvent,
    FormEventHandler,
    MouseEventHandler,
    useState,
    useEffect,
    useMemo,
} from "react";
import {
    Clock,
    Tag,
    Hourglass,
    Navigation,
    Sparkles,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Info,
    MapPin,
    Search,
    Check,
    X,
    Train,
    Car,
    Plane,
    Bus,
    Footprints,
    Plus,
    Trash2,
    Languages,
    Compass,
    Sliders,
    Building2,
} from "lucide-react";
import type {
    ItineraryActivitiy,
    ItineraryVM,
    TransitScheduleItem,
} from "../../models/types/ItineraryTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import {
    CATEGORY_DEFINITIONS,
    TRANSIT_MODES,
    getCategoryLabel,
    getCategoryTypeName,
} from "../../constants/Categories";
import { CategoryCustomSelect } from "../common/CategoryCustomSelect";
import { placeRepo } from "../../services/repositories/PlaceRepo";
import { toPlacesVM } from "../../services/mappers/PlaceMapper";
import { RoutingService } from "../../services/api/RoutingService";

type ItineraryActivityModalProps = {
    formData: ItineraryActivitiy;
    itinerary: ItineraryVM | null;
    itineraryCategory: any[];
    mode: string;
    theme: TripThemeConf | null;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormInputChange: ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >;
    onFormSubmit: FormEventHandler<HTMLFormElement>;
};

const ItineraryActivityModal = ({
    formData,
    itinerary,
    mode,
    theme,
    onCloseBtnClick,
    onFormInputChange,
    onFormSubmit,
}: ItineraryActivityModalProps) => {
    // 建立模式下：預設為 "place" (從地點優先新增)，若為手動輸入或編輯無地點活動則切換
    const [entryMode, setEntryMode] = useState<"place" | "manual">(
        mode === "create" || formData.linkId ? "place" : "manual"
    );
    const [places, setPlaces] = useState<PlaceVM[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
    const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
    const [routingMessage, setRoutingMessage] = useState<{
        type: "success" | "error" | "info";
        text: string;
    } | null>(null);

    // 載入當前行程的所有景點/地點清單
    useEffect(() => {
        if (!itinerary?.trip_id) return;
        let isMounted = true;
        setIsLoadingPlaces(true);

        placeRepo.list(itinerary.trip_id)
            .then((rows) => {
                if (isMounted) {
                    setPlaces(toPlacesVM(rows || []));
                }
            })
            .catch(console.error)
            .finally(() => {
                if (isMounted) setIsLoadingPlaces(false);
            });

        return () => {
            isMounted = false;
        };
    }, [itinerary?.trip_id]);

    // 篩選地點清單
    const filteredPlaces = useMemo(() => {
        if (!searchQuery.trim()) return places;
        const q = searchQuery.toLowerCase().trim();
        return places.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                (p.eng_name && p.eng_name.toLowerCase().includes(q)) ||
                (p.info?.native_name && p.info.native_name.toLowerCase().includes(q)) ||
                (p.info?.loc && p.info.loc.toLowerCase().includes(q))
        );
    }, [places, searchQuery]);

    const selectedPlace = useMemo(() => {
        if (!formData.linkId) return null;
        return places.find((p) => p.id === formData.linkId) || null;
    }, [places, formData.linkId]);

    // 選擇地點並自動填入各項欄位
    const handleSelectPlace = (place: PlaceVM) => {
        const createEvent = (name: string, value: string) =>
            ({
                target: { name, value },
                currentTarget: { name, value },
            }) as unknown as ChangeEvent<HTMLInputElement>;

        onFormInputChange(createEvent("linkId", place.id));
        if (place.name) {
            onFormInputChange(createEvent("title", place.name));
        }
        if (place.type) {
            onFormInputChange(createEvent("type", place.type));
        }
        if (place.eng_name || place.info?.native_name) {
            onFormInputChange(
                createEvent("desc", place.eng_name || place.info?.native_name || "")
            );
        }
        if (place.info?.stay_duration) {
            onFormInputChange(createEvent("duration", place.info.stay_duration));
        }
    };

    // 清除選取的地點 (改為自由填寫)
    const handleClearPlaceLink = () => {
        const createEvent = (name: string, value: string) =>
            ({
                target: { name, value },
                currentTarget: { name, value },
            }) as unknown as ChangeEvent<HTMLInputElement>;

        onFormInputChange(createEvent("linkId", ""));
    };

    // 自動計算至下一站路程
    const handleAutoCalculateRoute = async () => {
        setRoutingMessage(null);
        if (!itinerary) return;

        if (!formData.linkId) {
            setRoutingMessage({
                type: "info",
                text: "請先選取「連結地點」，才能取得起點經緯度！",
            });
            return;
        }

        setIsCalculatingRoute(true);

        try {
            const originPlace = await placeRepo.getById(formData.linkId);
            if (
                !originPlace ||
                typeof originPlace.lat !== "number" ||
                typeof originPlace.lng !== "number"
            ) {
                setRoutingMessage({
                    type: "error",
                    text: "出發地點尚未設定經緯度座標。",
                });
                setIsCalculatingRoute(false);
                return;
            }

            const activities = (itinerary.activities || [])
                .slice()
                .sort((a, b) => a.time.localeCompare(b.time));

            let currentIndex = -1;
            if (typeof formData.activityIndex === "number") {
                currentIndex = activities.findIndex(
                    (a, i) => (a.activityIndex !== undefined ? a.activityIndex === formData.activityIndex : i === formData.activityIndex)
                );
            }
            if (currentIndex === -1) {
                currentIndex = activities.findIndex(
                    (a) => a.title === formData.title && a.time === formData.time
                );
            }

            let nextActivity: ItineraryActivitiy | null = null;
            if (currentIndex >= 0) {
                for (let i = currentIndex + 1; i < activities.length; i++) {
                    if (activities[i].linkId) {
                        nextActivity = activities[i];
                        break;
                    }
                }
            } else if (activities.length > 0) {
                nextActivity =
                    activities.find((a) => a.time > formData.time && a.linkId) || null;
            }

            if (!nextActivity || !nextActivity.linkId) {
                setRoutingMessage({
                    type: "info",
                    text: `已確認出發點「${originPlace.name}」，但此日程後續尚未安排其他已連結地點的活動。`,
                });
                setIsCalculatingRoute(false);
                return;
            }

            const destPlace = await placeRepo.getById(nextActivity.linkId);
            if (
                !destPlace ||
                typeof destPlace.lat !== "number" ||
                typeof destPlace.lng !== "number"
            ) {
                setRoutingMessage({
                    type: "error",
                    text: `下一站「${nextActivity.title}」未包含經緯度座標！`,
                });
                setIsCalculatingRoute(false);
                return;
            }

            const activeMode = (!formData.transitMode || formData.transitMode === "none") ? "walk" : formData.transitMode;
            const profile = RoutingService.mapTransitModeToProfile(activeMode);
            const routeResult = await RoutingService.getRoute(
                { lat: originPlace.lat, lng: originPlace.lng },
                { lat: destPlace.lat, lng: destPlace.lng },
                profile
            );

            if (routeResult) {
                const durationEvent = {
                    target: {
                        name: "transitDuration",
                        value: `${routeResult.durationFormatted} (${routeResult.distanceFormatted})`,
                    },
                    currentTarget: {
                        name: "transitDuration",
                        value: `${routeResult.durationFormatted} (${routeResult.distanceFormatted})`,
                    },
                } as unknown as ChangeEvent<HTMLInputElement>;
                onFormInputChange(durationEvent);

                if (!formData.transitMode || formData.transitMode === "none") {
                    const modeEvent = {
                        target: { name: "transitMode", value: "walk" },
                        currentTarget: { name: "transitMode", value: "walk" },
                    } as unknown as ChangeEvent<HTMLInputElement>;
                    onFormInputChange(modeEvent);
                }

                setRoutingMessage({
                    type: "success",
                    text: `已成功取得「${originPlace.name}」➔「${destPlace.name}」路程：約 ${routeResult.durationFormatted}（${routeResult.distanceFormatted}）`,
                });
            } else {
                setRoutingMessage({
                    type: "error",
                    text: "OSM 路線規劃服務暫時無法計算兩點路徑。",
                });
            }
        } catch (err) {
            console.error("Failed to auto calculate route:", err);
            setRoutingMessage({
                type: "error",
                text: "計算過程發生問題，請稍候重試。",
            });
        } finally {
            setIsCalculatingRoute(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
            <div
                className="w-full max-w-xl bg-card text-card-foreground rounded-3xl shadow-2xl border border-border/80 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 📱 頂部行動把手 (Mobile drag indicator) */}
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mt-2.5 sm:hidden shrink-0" />

                {/* 📱 iOS 原生導航列 (iOS Navigation Top Bar) */}
                <div className="px-4 py-3 border-b border-border/70 bg-card/90 backdrop-blur-md flex items-center justify-between shrink-0">
                    <button
                        type="button"
                        onClick={onCloseBtnClick}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1"
                    >
                        取消
                    </button>

                    <h3 className="text-sm font-black tracking-tight text-foreground">
                        {mode === "create"
                            ? `新增 Day ${itinerary?.day_number || ""} 行程`
                            : `編輯行程 · ${formData.title || ""}`}
                    </h3>

                    <button
                        type="submit"
                        form="itinerary-activity-form"
                        className="text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white px-3.5 py-1.5 rounded-full transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                        {mode === "create" ? "加入" : "完成"}
                    </button>
                </div>

                {/* 主表單區域 */}
                <form
                    id="itinerary-activity-form"
                    onSubmit={onFormSubmit}
                    className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 no-scrollbar"
                >
                    {/* 🧭 新增模式：地點優先選取 vs 手動填寫 分段控制器 */}
                    <div className="p-1 rounded-2xl bg-muted/60 border border-border/60 flex items-center gap-1 text-xs">
                        <button
                            type="button"
                            onClick={() => setEntryMode("place")}
                            className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                entryMode === "place"
                                    ? "bg-card text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <MapPin size={13} className="text-blue-500" />
                            <span>從已加入景點選取 (推薦)</span>
                            {places.length > 0 && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                                    {places.length}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setEntryMode("manual")}
                            className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                entryMode === "manual"
                                    ? "bg-card text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <Building2 size={13} className="text-purple-500" />
                            <span>手動自由填寫</span>
                        </button>
                    </div>

                    {/* 📍 地點快速選擇區塊 (Place Picker Grid) */}
                    {entryMode === "place" && (
                        <div className="space-y-2.5">
                            {/* 已選取地點高亮狀態 */}
                            {selectedPlace ? (
                                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between gap-3 shadow-2xs">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-blue-500/30 bg-muted">
                                            {selectedPlace.image_url ? (
                                                <img
                                                    src={selectedPlace.image_url}
                                                    alt={selectedPlace.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-blue-500">
                                                    <MapPin size={18} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400">
                                                    {getCategoryLabel(selectedPlace.type)}
                                                </span>
                                                <h4 className="font-bold text-xs text-foreground truncate">
                                                    {selectedPlace.name}
                                                </h4>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                                                {selectedPlace.eng_name || selectedPlace.info?.loc || ""}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleClearPlaceLink}
                                        className="text-xs text-muted-foreground hover:text-rose-500 p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer shrink-0"
                                        title="取消連結此地點"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {/* 搜尋過濾輸入框 */}
                                    <div className="relative">
                                        <Search
                                            size={14}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                                        />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="搜尋旅行景點、餐廳、飯店名稱..."
                                            className="w-full bg-muted/40 border border-border/80 rounded-xl pl-9 pr-4 py-2 text-xs text-foreground outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>

                                    {/* 地點卡片列表 (Scrollable Grid) */}
                                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 no-scrollbar border border-border/60 rounded-2xl p-1.5 bg-muted/20">
                                        {isLoadingPlaces ? (
                                            <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                                                <Loader2 size={13} className="animate-spin text-blue-500" />
                                                <span>載入地點清單...</span>
                                            </div>
                                        ) : filteredPlaces.length === 0 ? (
                                            <div className="p-4 text-center text-xs text-muted-foreground">
                                                {places.length === 0
                                                    ? "此旅行尚未新增任何景點，請先至地點庫建立或使用手動填寫。"
                                                    : "找不到符合的地點"}
                                            </div>
                                        ) : (
                                            filteredPlaces.map((place) => {
                                                const isSelected = formData.linkId === place.id;
                                                return (
                                                    <div
                                                        key={place.id}
                                                        onClick={() => handleSelectPlace(place)}
                                                        className={`p-2 rounded-xl border flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                                                            isSelected
                                                                ? "bg-blue-500/15 border-blue-500 text-foreground"
                                                                : "bg-card border-border/60 hover:border-border hover:bg-muted/30"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted">
                                                                {place.image_url ? (
                                                                    <img
                                                                        src={place.image_url}
                                                                        alt={place.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                                                                        <MapPin size={14} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-muted text-muted-foreground">
                                                                        {getCategoryLabel(place.type)}
                                                                    </span>
                                                                    <span className="font-bold text-xs text-foreground truncate">
                                                                        {place.name}
                                                                    </span>
                                                                </div>
                                                                {(place.eng_name || place.info?.stay_duration) && (
                                                                    <div className="text-[10px] text-muted-foreground font-mono truncate mt-0.5 flex items-center gap-2">
                                                                        {place.eng_name && <span>{place.eng_name}</span>}
                                                                        {place.info?.stay_duration && (
                                                                            <span className="text-primary font-sans">
                                                                                ⏱️ {place.info.stay_duration}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="shrink-0">
                                                            {isSelected ? (
                                                                <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                                                                    <Check size={12} />
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-blue-500 hover:underline px-1.5 py-0.5">
                                                                    選擇
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 分類選擇 */}
                    <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                            活動分類 (CATEGORY)
                        </span>
                        <CategoryCustomSelect
                            value={formData.type || "sight"}
                            onChange={(newTypeId) => {
                                const event = {
                                    target: { name: "type", value: newTypeId },
                                    currentTarget: { name: "type", value: newTypeId },
                                } as unknown as ChangeEvent<HTMLInputElement>;
                                onFormInputChange(event);
                            }}
                        />
                    </div>

                    {/* Section: 基本排程設定 (Inset Grouped Table) */}
                    <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                            時間與活動資訊 (TIMING & INFO)
                        </span>

                        <div className="bg-card border border-border/80 rounded-2xl overflow-hidden divide-y divide-border/60 text-xs shadow-2xs">
                            {/* 1. 時間 */}
                            <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                                <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium flex items-center gap-1">
                                    <Clock size={13} className="text-blue-500" />
                                    <span>開始時間</span>
                                    <span className="text-rose-500 font-bold">*</span>
                                </span>
                                <input
                                    required
                                    type="time"
                                    name="time"
                                    value={formData.time}
                                    onChange={onFormInputChange}
                                    className="min-w-0 flex-1 text-left font-mono font-bold text-foreground bg-transparent outline-none cursor-pointer dark:[color-scheme:dark]"
                                />
                            </div>

                            {/* 2. 停留時間 */}
                            <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                                <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium flex items-center gap-1">
                                    <Hourglass size={13} className="text-amber-500" />
                                    <span>預計停留</span>
                                </span>
                                <input
                                    type="text"
                                    name="duration"
                                    value={formData.duration || ""}
                                    onChange={onFormInputChange}
                                    placeholder="例: 1.5小時, 45分鐘"
                                    className="min-w-0 flex-1 text-left font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                                />
                            </div>

                            {/* 3. 活動標題 */}
                            <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                                <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium flex items-center gap-1">
                                    <span>活動標題</span>
                                    <span className="text-rose-500 font-bold">*</span>
                                </span>
                                <input
                                    required
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={onFormInputChange}
                                    placeholder="例: 清水寺"
                                    className="min-w-0 flex-1 text-left font-bold text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                                />
                            </div>

                            {/* 4. 備註描述 */}
                            <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                                <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium">
                                    備註說明
                                </span>
                                <input
                                    type="text"
                                    name="desc"
                                    value={formData.desc || ""}
                                    onChange={onFormInputChange}
                                    placeholder="例: Kiyomizu-dera / 記得攜帶水壺"
                                    className="min-w-0 flex-1 text-left font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: 前往下一站的交通 (Transit & Navigation) */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                <Navigation size={12} className="text-blue-500" />
                                <span>前往下一站的交通 (TRANSIT)</span>
                            </span>

                            {/* 自動路線估算按鈕 */}
                            {mode === "edit" && formData.linkId && (
                                <button
                                    type="button"
                                    onClick={handleAutoCalculateRoute}
                                    disabled={isCalculatingRoute}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all border border-blue-500/20 cursor-pointer disabled:opacity-50"
                                    title="透過地圖服務自動計算距離與路程時間"
                                >
                                    {isCalculatingRoute ? (
                                        <>
                                            <Loader2 size={10} className="animate-spin" />
                                            <span>計算中...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={10} />
                                            <span>⚡ 地圖自動估算</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* 計算狀態提示 */}
                        {routingMessage && (
                            <div
                                className={`p-2.5 rounded-xl text-xs flex items-start gap-1.5 ${
                                    routingMessage.type === "success"
                                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                                        : routingMessage.type === "error"
                                        ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                                        : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                                }`}
                            >
                                {routingMessage.type === "success" ? (
                                    <CheckCircle2 size={13} className="shrink-0 mt-0.5" />
                                ) : (
                                    <Info size={13} className="shrink-0 mt-0.5" />
                                )}
                                <span className="leading-tight">{routingMessage.text}</span>
                            </div>
                        )}

                        <div className="bg-card border border-border/80 rounded-2xl overflow-hidden divide-y divide-border/60 text-xs shadow-2xs">
                            {/* 交通工具 */}
                            <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                                <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium">
                                    交通工具
                                </span>
                                <select
                                    name="transitMode"
                                    value={formData.transitMode || "none"}
                                    onChange={onFormInputChange as any}
                                    className="bg-muted/40 text-foreground text-xs font-semibold px-2.5 py-1 rounded-xl outline-none cursor-pointer border border-border/60"
                                >
                                    {TRANSIT_MODES.map((mode) => (
                                        <option key={mode.id} value={mode.id} className="bg-background text-foreground">
                                            {mode.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 預估路程時間 */}
                            <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                                <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium">
                                    預估路程時間
                                </span>
                                <input
                                    type="text"
                                    name="transitDuration"
                                    value={formData.transitDuration || ""}
                                    onChange={onFormInputChange}
                                    placeholder="例: 15分鐘, 30分鐘 (3.2 km)"
                                    className="min-w-0 flex-1 text-left font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                                />
                            </div>

                            {/* 交通細節 (自駕、鐵路路線等) */}
                            {formData.transitMode && formData.transitMode !== "none" && (
                                <>
                                    {formData.transitMode === "car" && (
                                        <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card">
                                            <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium">
                                                租車/自駕備註
                                            </span>
                                            <input
                                                type="text"
                                                name="transitDetails.carRentalCompany"
                                                value={formData.transitDetails?.carRentalCompany || ""}
                                                onChange={onFormInputChange}
                                                placeholder="例: Toyota Rent a Car (那霸機場店)"
                                                className="min-w-0 flex-1 text-left font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                                            />
                                        </div>
                                    )}

                                    {["train", "subway", "bus", "ferry"].includes(formData.transitMode) && (
                                        <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card">
                                            <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium">
                                                搭乘路線/月台
                                            </span>
                                            <input
                                                type="text"
                                                name="transitDetails.companyAndLine"
                                                value={formData.transitDetails?.companyAndLine || ""}
                                                onChange={onFormInputChange}
                                                placeholder="例: JR京都線 (4番月台)"
                                                className="min-w-0 flex-1 text-left font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                                            />
                                        </div>
                                    )}

                                    {formData.transitMode === "flight" && (
                                        <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card">
                                            <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium">
                                                航班資訊
                                            </span>
                                            <input
                                                type="text"
                                                name="transitDetails.flightNumber"
                                                value={formData.transitDetails?.flightNumber || ""}
                                                onChange={onFormInputChange}
                                                placeholder="例: JX820 (T1 登機門 B5)"
                                                className="min-w-0 flex-1 text-left font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ItineraryActivityModal;
