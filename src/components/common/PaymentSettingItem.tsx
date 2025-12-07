import { GripVertical, Trash2 } from "lucide-react";
import { useSortable, defaultAnimateLayoutChanges } from "@dnd-kit/sortable";

const PaymentSettingItem = ({
    id,
    settings,
    method,
    index,
    onPaymentChange,
    onPaymentRemove,
}) => {
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
        ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
              transition,
              willChange: "transform",
              backfaceVisibility: "hidden",
              WebkitFontSmoothing: "antialiased",
          }
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
                        className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-sm"
                        placeholder="名稱"
                    />
                </div>
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
            {(method.type === "credit" || method.type === "debit") && (
                <div className="flex items-center space-x-2 pt-2 ">
                    <span className="text-[10px] text-gray-500 uppercase">
                        額度/上限 (
                        {method.currency || settings.homeCurrency || "---"})
                    </span>
                    <input
                        type="number"
                        value={method.credit_limit || 0}
                        onChange={(e) =>
                            onPaymentChange(
                                index,
                                "credit_limit",
                                parseInt(e.target.value) || 0,
                            )
                        }
                        className="w-full bg-white border border-gray-300 p-3 font-mono text-sm text-right font-bold outline-none focus:border-black"
                        placeholder="無上限填 0"
                    />
                </div>
            )}
        </div>
    );
};

export default PaymentSettingItem;
