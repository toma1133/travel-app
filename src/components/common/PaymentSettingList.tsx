import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import PaymentSettingItem from "./PaymentSettingItem";
import { useEffect, useRef } from "react";

const PaymentSettingList = ({
    settings,
    paymentMethods,
    onPaymentChange,
    onPaymentRemove,
    onDragPaymentItem,
}) => {
    const prevPaymentLength = useRef(paymentMethods.length);
    const endRef = useRef(null);
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    useEffect(() => {
        if (paymentMethods.length > prevPaymentLength.current) {
            endRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        prevPaymentLength.current = paymentMethods.length;
    }, [paymentMethods]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragPaymentItem}
        >
            <SortableContext
                items={paymentMethods.map((m) => m.id)}
                strategy={verticalListSortingStrategy}
            >
                {Array.isArray(paymentMethods) &&
                    paymentMethods.map((method, index) => (
                        <PaymentSettingItem
                            key={method.id}
                            id={method.id}
                            settings={settings}
                            method={method}
                            index={index}
                            onPaymentChange={onPaymentChange}
                            onPaymentRemove={onPaymentRemove}
                        />
                    ))}
                <div ref={endRef} />
            </SortableContext>
        </DndContext>
    );
};

export default PaymentSettingList;
