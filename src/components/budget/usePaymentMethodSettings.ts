import { useState, ChangeEvent } from "react";
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type { TripSettingConf } from "../../models/types/TripTypes";

export function usePaymentMethodSettings() {
    const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
    const [formSetting, setFormSetting] = useState<TripSettingConf | null>(null);
    const [formPaymentMethods, setFormPaymentMethods] = useState<PaymentMethodRow[] | undefined>([]);

    const handleAddPayment = (tripId: string, localCurrency: string, userId: string) => {
        setFormPaymentMethods((prev) => [
            ...(prev || []),
            {
                credit_limit: 0,
                currency_code: localCurrency,
                id: crypto.randomUUID(),
                name: "新卡片",
                order: prev?.length || 0,
                trip_id: tripId,
                type: "credit",
                user_id: userId,
                created_at: null,
                updated_at: null,
            },
        ]);
    };

    const handleDragPaymentItem = (e: DragEndEvent) => {
        if (!formPaymentMethods || !e.over || e.active.id === e.over.id) return;
        const oldIdx = formPaymentMethods.findIndex((m) => m.id === e.active.id);
        const newIdx = formPaymentMethods.findIndex((m) => m.id === e.over!.id);
        setFormPaymentMethods(
            arrayMove(formPaymentMethods, oldIdx, newIdx).map((m, idx) => ({ ...m, order: idx }))
        );
    };

    const handlePaymentChange = (idx: number, fld: string, val: string | number) => {
        const next = [...(formPaymentMethods || [])];
        next[idx] = { ...next[idx], [fld]: val };
        setFormPaymentMethods(next);
    };

    const handlePaymentMove = (idx: number, direction: "up" | "down") => {
        if (!formPaymentMethods) return;
        const targetIdx = direction === "up" ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= formPaymentMethods.length) return;
        setFormPaymentMethods(
            arrayMove(formPaymentMethods, idx, targetIdx).map((m, i) => ({ ...m, order: i }))
        );
    };

    const handlePaymentRemove = (idx: number) => {
        setFormPaymentMethods(
            formPaymentMethods?.filter((_, i) => i !== idx).map((m, i) => ({ ...m, order: i }))
        );
    };

    const handleSettingChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormSetting((prev) => ({ ...prev, [e.target.name]: e.target.value } as TripSettingConf));
    };

    return {
        isSettingModalOpen,
        setIsSettingModalOpen,
        formSetting,
        setFormSetting,
        formPaymentMethods,
        setFormPaymentMethods,
        handleAddPayment,
        handleDragPaymentItem,
        handlePaymentChange,
        handlePaymentMove,
        handlePaymentRemove,
        handleSettingChange,
    };
}
