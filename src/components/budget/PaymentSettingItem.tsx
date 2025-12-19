import { CSSProperties } from "react";
import { ArrowUp, ArrowDown, GripVertical, Trash2 } from "lucide-react";
import { useSortable, defaultAnimateLayoutChanges } from "@dnd-kit/sortable";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type { TripSettingConf } from "../../models/types/TripTypes";

type PaymentSettingItemProps = {
    id: string;
    setting: TripSettingConf | null;
    method: PaymentMethodRow;
    index: number;
    onPaymentChange: (
        index: number,
        field: string,
        value: string | number
    ) => void;
    onPaymentRemove: (index: number) => void;
    onPaymentMoveUp: (index: number) => void;
    onPaymentMoveDown: (index: number) => void;
};

const PaymentSettingItem = ({
    id,
    setting,
    method,
    index,
    onPaymentChange,
    onPaymentRemove,
    onPaymentMoveUp,
    onPaymentMoveDown,
}: PaymentSettingItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id,
        animateLayoutChanges: (args) => defaultAnimateLayoutChanges(args),
    });

    const style = transform
        ? ({
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
              transition,
              willChange: "transform",
              backfaceVisibility: "hidden",
              WebkitFontSmoothing: "antialiased",
          } as CSSProperties)
        : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={`
                bg-white p-2 mb-1 rounded-lg border border-gray-200 shadow-md flex items-center
                ${
                    isDragging
                        ? "opacity-30 border-dashed border-2 border-blue-400"
                        : "hover:shadow-lg"
                }
            `}
        >
            <GripVertical
                size={16}
                className="text-gray-400 flex-shrink-0 cursor-move"
                {...listeners}
            />
            <div className="flex flex-col space-y-2">
                <div className="space-x-2 px-2">
                    <label
                        htmlFor="name"
                        className="block font-bold uppercase flex items-center text-gray-500 text-xs"
                    >
                        支付名稱
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={method.name || ""}
                        onChange={(e) =>
                            onPaymentChange(index, "name", e.target.value)
                        }
                        className="w-full bg-transparent border-b border-gray-300 outline-none font-[Noto_Sans_TC] text-base"
                        placeholder="名稱"
                    />
                </div>
                <div className="space-x-2 px-2">
                    <label
                        htmlFor="credit_limit"
                        className="block font-bold uppercase flex items-center text-gray-500 text-xs"
                    >
                        額度/上限 (
                        {method.currency_code || setting?.homeCurrency || "---"}
                        )
                    </label>
                    <input
                        type="number"
                        name="credit_limit"
                        value={method.credit_limit || 0}
                        onChange={(e) =>
                            onPaymentChange(
                                index,
                                "credit_limit",
                                parseInt(e.target.value) || 0
                            )
                        }
                        onFocus={(e) => {
                            e.currentTarget.select();
                        }}
                        className="w-full bg-transparent border-b border-gray-300 outline-none font-mono text-base"
                        placeholder="無上限填 0"
                    />
                </div>
            </div>
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => onPaymentMoveUp(index)}
                    className="p-1 text-gray-400 hover:text-blue-500"
                    title="Up"
                >
                    <ArrowUp size={14} />
                </button>
                <button
                    type="button"
                    onClick={() => onPaymentMoveDown(index)}
                    className="p-1 text-gray-400 hover:text-blue-500"
                    title="down"
                >
                    <ArrowDown size={14} />
                </button>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onPaymentRemove(index);
                    }}
                    className="text-gray-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors flex-shrink-0"
                    aria-label="刪除此支付方式"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};

export default PaymentSettingItem;
