import { useEffect, useRef } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import PaymentSettingItem from "../budget/PaymentSettingItem";
import type { TripSettingConf } from "../../models/types/TripTypes";
import { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";

type PaymentSettingListProps = {
    setting: TripSettingConf | null;
    paymentMethods?: PaymentMethodRow[];
    onDragPaymentItem: (event: DragEndEvent) => void;
    onPaymentChange: (
        index: number,
        field: string,
        value: string | number
    ) => void;
    onPaymentRemove: (index: number) => void;
    onPaymentMoveUp: (index: number) => void;
    onPaymentMoveDown: (index: number) => void;
};

const PaymentSettingList = ({
    setting,
    paymentMethods,
    onDragPaymentItem,
    onPaymentChange,
    onPaymentRemove,
    onPaymentMoveUp,
    onPaymentMoveDown,
}: PaymentSettingListProps) => {
    const prevPaymentLength = useRef(paymentMethods?.length);
    const endRef = useRef<HTMLDivElement | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (paymentMethods?.length! > prevPaymentLength.current!) {
            endRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        prevPaymentLength.current = paymentMethods?.length;
    }, [paymentMethods]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragPaymentItem}
        >
            {Array.isArray(paymentMethods) && (
                <SortableContext
                    items={paymentMethods.map((m) => m.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {Array.isArray(paymentMethods) &&
                        paymentMethods.map((method, index) => (
                            <PaymentSettingItem
                                key={method.id}
                                id={method.id}
                                setting={setting}
                                method={method}
                                index={index}
                                onPaymentChange={onPaymentChange}
                                onPaymentRemove={onPaymentRemove}
                                onPaymentMoveUp={onPaymentMoveUp}
                                onPaymentMoveDown={onPaymentMoveDown}
                            />
                        ))}
                    <div ref={endRef} />
                </SortableContext>
            )}
        </DndContext>
    );
};

export default PaymentSettingList;
