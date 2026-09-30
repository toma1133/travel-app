import React, { JSX, MouseEventHandler, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import type { PlaceVM, RecommendedItem } from "../../models/types/PlaceTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";
import type { ItineraryActivitiy } from "../../models/types/ItineraryTypes";
import { GlassModal } from "../ui/GlassModal";
import { playPronunciation } from "../../utils/SpeechLanguageUtil";
import {
    ActivityPreviewContent,
    PlacePreviewHeroHeader,
    OpeningHoursViewer,
    PlaceTransitLocationViewer,
    RecommendedItemsViewer,
    AmenitiesViewer,
} from "../place/modal/viewers";

export type PreviewPlaceModalProps = {
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    place?: PlaceVM | null;
    activity?: ItineraryActivitiy | null;
    theme?: TripThemeConf | null;
    children?: JSX.Element;
};

const PreviewPlaceModal: React.FC<PreviewPlaceModalProps> = ({
    onCloseBtnClick,
    place,
    activity,
    children,
}) => {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [speakingItemIdx, setSpeakingItemIdx] = useState<number | null>(null);

    const handleClose = () => {
        const fakeEvent = {
            stopPropagation: () => {},
            preventDefault: () => {},
        } as unknown as React.MouseEvent<HTMLButtonElement>;
        onCloseBtnClick(fakeEvent);
    };

    const handleSpeakPlace = () => {
        if (!place?.info?.native_name) return;
        playPronunciation(place.info.native_name, {
            context: {
                address: place.info?.loc,
                mapUrl: place.map_url,
                currency: place.info?.price,
            },
            onStart: () => setSpeaking(true),
            onEnd: () => setSpeaking(false),
            onError: () => setSpeaking(false),
        });
    };

    const handleSpeakItem = (item: RecommendedItem, idx: number, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!item.native_name || !place) return;
        playPronunciation(item.native_name, {
            context: {
                address: place.info?.loc,
                mapUrl: place.map_url,
                currency: place.info?.price,
            },
            onStart: () => setSpeakingItemIdx(idx),
            onEnd: () => setSpeakingItemIdx(null),
            onError: () => setSpeakingItemIdx(null),
        });
    };

    const handleCopyAddress = () => {
        if (!place) return;
        const text = place.info?.loc || place.name;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // 1. 純行程活動預覽 (無綁定地點資料庫項目)
    if (!place && activity) {
        return (
            <GlassModal
                isOpen={true}
                onClose={handleClose}
                maxWidth="2xl"
                className="max-h-[90vh] bg-card/95 border border-border/80 overflow-hidden p-0"
            >
                <ActivityPreviewContent activity={activity} onClose={handleClose} />
            </GlassModal>
        );
    }

    // 2. 自訂 Children 容器
    if (!place) {
        return (
            <GlassModal
                isOpen={true}
                onClose={handleClose}
                maxWidth="lg"
                className="bg-card/95 border border-border overflow-hidden p-6"
            >
                <button
                    type="button"
                    onClick={onCloseBtnClick}
                    className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted rounded-full transition-colors z-20 cursor-pointer"
                    title="關閉"
                >
                    <X size={20} />
                </button>
                {children}
            </GlassModal>
        );
    }

    // 3. 地標完整預覽
    return (
        <GlassModal
            isOpen={true}
            onClose={handleClose}
            maxWidth="2xl"
            className="max-h-[90vh] bg-card/95 border border-border/80 overflow-hidden flex flex-col p-0"
        >
            <div className="overflow-y-auto no-scrollbar flex-1 pb-6 space-y-4.5">
                {/* 頂部 Hero 與基本資訊、操作列 */}
                <PlacePreviewHeroHeader
                    place={place}
                    activity={activity}
                    speaking={speaking}
                    onSpeak={handleSpeakPlace}
                    onClose={handleClose}
                    onNavigateToShopping={() => {
                        if (place.trip_id) {
                            navigate(`/trip/${place.trip_id}/shopping`);
                        }
                    }}
                />

                <div className="px-5 sm:px-6 space-y-4.5">
                    {/* 營業時間 / 入住退房資訊 */}
                    <OpeningHoursViewer
                        open={place.info?.open ?? undefined}
                        closedDays={place.info?.closed_days ?? undefined}
                        checkIn={place.info?.check_in ?? undefined}
                        checkOut={place.info?.check_out ?? undefined}
                        type={place.type ?? undefined}
                    />

                    {/* 地點前往與入場規定 */}
                    <PlaceTransitLocationViewer
                        transitAccess={place.info?.transit_access ?? undefined}
                        loc={place.info?.loc ?? undefined}
                        bookingStatus={place.info?.booking_status ?? undefined}
                        copied={copied}
                        onCopyAddress={handleCopyAddress}
                    />

                    {/* 推薦招牌品項 / 伴手禮 */}
                    <RecommendedItemsViewer
                        items={place.info?.recommended_items ?? undefined}
                        onSpeakItem={handleSpeakItem}
                        speakingItemIdx={speakingItemIdx}
                    />

                    {/* 付款方式與設施標籤 */}
                    <AmenitiesViewer
                        paymentMethods={place.info?.payment_methods ?? undefined}
                        amenities={place.info?.amenities ?? undefined}
                    />
                </div>
            </div>
        </GlassModal>
    );
};

export default PreviewPlaceModal;
