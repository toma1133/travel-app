import { MouseEventHandler, FormEventHandler, ChangeEventHandler } from "react";
import { RefreshCw, X } from "lucide-react";
import { DragEndEvent } from "@dnd-kit/core";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type {
    TripSettingConf,
    TripThemeConf,
} from "../../models/types/TripTypes";
import PaymentSettingList from "./PaymentSettingList";

type SettingModalProps = {
    paymentMethods?: PaymentMethodRow[];
    setting: TripSettingConf | null;
    theme: TripThemeConf | null;
    onAddPaymentMethodBtnClick: MouseEventHandler<HTMLButtonElement>;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onDragPaymentItem: (event: DragEndEvent) => void;
    onPaymentChange: (
        index: number,
        field: string,
        value: string | number
    ) => void;
    onPaymentRemove: (index: number) => void;
    onPaymentMoveUp: (index: number) => void;
    onPaymentMoveDown: (index: number) => void;
    onResetBtnClick: MouseEventHandler<HTMLButtonElement>;
    onSettingChange: ChangeEventHandler<HTMLInputElement>;
    onSubmit: FormEventHandler<HTMLFormElement>;
};

const SettingModal = ({
    paymentMethods,
    setting,
    theme,
    onAddPaymentMethodBtnClick,
    onCloseBtnClick,
    onDragPaymentItem,
    onPaymentChange,
    onPaymentMoveDown,
    onPaymentMoveUp,
    onPaymentRemove,
    onResetBtnClick,
    onSettingChange,
    onSubmit,
}: SettingModalProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#F2F2F0] w-full max-w-sm p-6 rounded-t-2xl sm:rounded-none shadow-2xl animate-in slide-in-from-bottom border border-gray-600">
                <div className="flex justify-between items-center mb-6 border-b border-gray-300 pb-2">
                    <h3 className="font-[Noto_Sans_TC] font-bold text-xl text-gray-900">
                        系統設定
                    </h3>
                    <button
                        type="button"
                        onClick={onCloseBtnClick}
                        title="Close"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                <form onSubmit={onSubmit} className="space-y-5">
                    {/* Currency Section */}
                    <div className="mb-8 space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            匯率設定
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-1">
                                    本國幣 (Home)
                                </label>
                                <input
                                    type="text"
                                    name="homeCurrency"
                                    value={setting?.homeCurrency}
                                    onChange={onSettingChange}
                                    className="w-full bg-white border border-gray-300 p-3 font-mono text-2xl text-right font-bold outline-none focus:border-black"
                                    placeholder="TWD"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-1">
                                    當地幣 (Local)
                                </label>
                                <input
                                    type="text"
                                    name="localCurrency"
                                    value={setting?.localCurrency}
                                    onChange={onSettingChange}
                                    className="w-full bg-white border border-gray-300 p-3 font-mono text-2xl text-right font-bold outline-none focus:border-black"
                                    placeholder="JPY"
                                />
                            </div>
                        </div>
                        <div className="relative">
                            <label className="block text-[10px] text-gray-500 mb-1">
                                匯率 (1 {setting?.localCurrency} = ?{" "}
                                {setting?.homeCurrency})
                            </label>
                            <input
                                type="number"
                                step="1"
                                name="exchangeRate"
                                value={setting?.exchangeRate}
                                onChange={onSettingChange}
                                className="w-full bg-white border border-gray-300 p-3 font-mono text-2xl text-right font-bold outline-none focus:border-black"
                                placeholder="0.2"
                            />
                        </div>
                    </div>
                    {/* Payment Methods Section */}
                    <div className="mb-8 space-y-4">
                        <div className="flex justify-between items-end">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                支付工具與額度
                            </h4>
                            <button
                                type="button"
                                onClick={onAddPaymentMethodBtnClick}
                                className="text-[10px] underline text-gray-600"
                                title="新增"
                            >
                                新增
                            </button>
                        </div>
                        <div className="max-h-50 overflow-y-auto no-scrollbar scroll-smooth">
                            <PaymentSettingList
                                setting={setting}
                                onDragPaymentItem={onDragPaymentItem}
                                paymentMethods={paymentMethods}
                                onPaymentChange={onPaymentChange}
                                onPaymentRemove={onPaymentRemove}
                                onPaymentMoveUp={onPaymentMoveUp}
                                onPaymentMoveDown={onPaymentMoveDown}
                            />
                        </div>
                    </div>
                    <div className="space-y-3 pt-4 border-t border-gray-300">
                        <button
                            type="submit"
                            className={`w-full py-3 ${theme?.accent} text-white font-bold text-sm tracking-widest`}
                            title="儲存變更"
                        >
                            儲存變更
                        </button>
                        <button
                            type="button"
                            onClick={onResetBtnClick}
                            className="w-full py-3 bg-transparent text-gray-400 text-xs flex justify-center items-center hover:text-red-500"
                            title="重置"
                        >
                            <RefreshCw size={12} className="mr-1" />
                            重置所有資料
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingModal;
