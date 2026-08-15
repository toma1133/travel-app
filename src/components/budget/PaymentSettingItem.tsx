import { CSSProperties } from "react";
import { ArrowUp, ArrowDown, GripVertical, Trash2 } from "lucide-react";
import { useSortable, defaultAnimateLayoutChanges } from "@dnd-kit/sortable";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type { TripSettingConf } from "../../models/types/TripTypes";
import { CURRENCIES } from "../../constants/Currencies";
import { formatThousands, handleThousandsInputChange } from "../../utils/numberFormat";

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
                bg-card p-3 mb-2 rounded-xl border border-border/80 shadow-sm flex items-center gap-3 transition-all
                ${
                    isDragging
                        ? "opacity-30 border-dashed border-2 border-primary"
                        : "hover:border-border hover:shadow-md"
                }
            `}
        >
            <GripVertical
                size={18}
                className="text-muted-foreground/60 hover:text-foreground shrink-0 cursor-move"
                {...listeners}
            />
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                {/* 支付名稱 */}
                <div className="sm:col-span-5">
                    <label
                        htmlFor="name"
                        className="font-bold uppercase flex items-center text-muted-foreground text-[11px] mb-1"
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
                        className="w-full bg-transparent border-b border-border py-1 outline-none font-[Noto_Sans_TC] text-sm text-foreground focus:border-primary transition-colors"
                        placeholder="名稱"
                    />
                </div>
                {/* 額度上限 */}
                <div className="sm:col-span-4">
                    <label
                        htmlFor="credit_limit"
                        className="font-bold uppercase flex items-center text-muted-foreground text-[11px] mb-1"
                    >
                        額度 / 上限
                    </label>
                    <input
                        type="text"
                        inputMode="numeric"
                        name="credit_limit"
                        value={method.credit_limit ? formatThousands(method.credit_limit, false) : (method.credit_limit === 0 ? "0" : "")}
                        onChange={(e) => {
                            handleThousandsInputChange(
                                e,
                                (formatted, numericValue) => {
                                    onPaymentChange(
                                        index,
                                        "credit_limit",
                                        numericValue
                                    );
                                },
                                { allowDecimal: false }
                            );
                        }}
                        onFocus={(e) => {
                            e.currentTarget.select();
                        }}
                        className="w-full bg-transparent border-b border-border py-1 outline-none font-mono text-sm text-foreground focus:border-primary transition-colors"
                        placeholder="無上限填 0"
                    />
                </div>
                {/* 幣別 */}
                <div className="sm:col-span-3">
                    <label
                        htmlFor="currency_code"
                        className="font-bold uppercase flex items-center text-muted-foreground text-[11px] mb-1"
                    >
                        幣別
                    </label>
                    <select
                        name="currency_code"
                        value={method.currency_code || setting?.homeCurrency || ""}
                        onChange={(e) => onPaymentChange(index, "currency_code", e.target.value)}
                        className="w-full bg-transparent border-b border-border py-1 outline-none font-mono text-xs text-foreground focus:border-primary transition-colors dark:bg-card"
                    >
                        <option value="">預設</option>
                        {CURRENCIES.map(c => (
                            <option key={c.code} value={c.code}>{c.code}</option>
                        ))}
                    </select>
                </div>
            </div>
            {/* 操作按鈕 */}
            <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-border/40">
                <button
                    type="button"
                    onClick={() => onPaymentMoveUp(index)}
                    className="p-1 text-muted-foreground hover:text-primary transition-colors"
                    title="向上移"
                >
                    <ArrowUp size={15} />
                </button>
                <button
                    type="button"
                    onClick={() => onPaymentMoveDown(index)}
                    className="p-1 text-muted-foreground hover:text-primary transition-colors"
                    title="向下移"
                >
                    <ArrowDown size={15} />
                </button>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onPaymentRemove(index);
                    }}
                    className="text-muted-foreground/60 hover:text-rose-500 p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    aria-label="刪除此支付方式"
                    title="刪除"
                >
                    <Trash2 size={15} />
                </button>
            </div>
        </div>
    );
};

export default PaymentSettingItem;
