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
                bg-white p-3 mb-1 rounded-lg border border-gray-200 shadow-md space-y-2
                ${
                    isDragging
                        ? "opacity-30 border-dashed border-2 border-blue-400"
                        : "hover:shadow-lg"
                }
            `}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 w-3/4">
                    <GripVertical
                        size={16}
                        className="text-gray-400 flex-shrink-0 cursor-move"
                        {...listeners}
                    />
                    <input
                        value={method.name || ""}
                        onChange={(e) =>
                            onPaymentChange(index, "name", e.target.value)
                        }
                        className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base"
                        placeholder="名稱"
                    />
                </div>{" "}
                {/* 上下箭頭 */}
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
                {method.id !== "cash" && method.type !== "cash" && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent drag interaction when clicking trash
                            onPaymentRemove(index);
                        }}
                        className="text-gray-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors flex-shrink-0"
                        aria-label="刪除此支付方式"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
            <div className="flex items-center space-x-2 pt-2 ">
                <span className="text-[10px] text-gray-500 uppercase">
                    額度/上限 (
                    {method.currency_code || setting?.homeCurrency || "---"})
                </span>
                <input
                    type="number"
                    value={method.credit_limit || 0}
                    onChange={(e) =>
                        onPaymentChange(
                            index,
                            "credit_limit",
                            parseInt(e.target.value) || 0
                        )
                    }
                    className="w-full bg-white border border-gray-300 p-3 font-mono text-base text-right font-bold outline-none focus:border-black"
                    placeholder="無上限填 0"
                />
            </div>
        </div>
    );
};

export default PaymentSettingItem;
