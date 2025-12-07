import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import PaymentSettingItem from "./PaymentSettingItem";

const PaymentSettingList = ({
    settings,
    paymentMethods,
    onPaymentChange,
    onPaymentRemove,
    onDragPaymentItem,
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

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
            </SortableContext>
        </DndContext>
    );
};

export default PaymentSettingList;
