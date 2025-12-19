import { MouseEventHandler, FormEventHandler, ChangeEventHandler } from "react";
import { RefreshCw, X } from "lucide-react";
import { DragEndEvent } from "@dnd-kit/core";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type {
    TripSettingConf,
    TripThemeConf,
} from "../../models/types/TripTypes";
import PaymentSettingList from "./PaymentSettingList";
import FormModal from "../common/FormModal";

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
    onFormSubmit: FormEventHandler<HTMLFormElement>;
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
    onFormSubmit,
}: SettingModalProps) => {
    return (
        <FormModal
            formId={"setting-form"}
            modalTitle={"系統設定"}
            modalSaveTitle={"儲存變更"}
            theme={theme}
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onFormSubmit}
        >
            {/* Currency Section */}
            <div className="mb-8 space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    匯率設定
                </h4>
                <div>
                    <label
                        htmlFor="homeCurrency"
                        className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                    >
                        本國幣 (Home)
                    </label>
                    <input
                        type="text"
                        name="homeCurrency"
                        value={setting?.homeCurrency}
                        onChange={onSettingChange}
                        className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-mono text-base"
                        placeholder="TWD"
                    />
                </div>
                <div>
                    <label
                        htmlFor="localCurrency"
                        className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                    >
                        當地幣 (Local)
                    </label>
                    <input
                        type="text"
                        name="localCurrency"
                        value={setting?.localCurrency}
                        onChange={onSettingChange}
                        className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-mono text-base"
                        placeholder="JPY"
                    />
                </div>
                <div>
                    <label
                        htmlFor="exchangeRate"
                        className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                    >
                        匯率 (1 {setting?.localCurrency} = ?{" "}
                        {setting?.homeCurrency})
                    </label>
                    <input
                        type="number"
                        step="1"
                        name="exchangeRate"
                        value={setting?.exchangeRate}
                        onChange={onSettingChange}
                        className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-mono text-base"
                        placeholder="0.2"
                    />
                </div>
            </div>
            {/* Payment Methods Section */}
            <div className="mb-8 space-y-4">
                <div className="flex justify-between items-end">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        支付工具與額度
                    </h4>
                    <button
                        type="button"
                        onClick={onAddPaymentMethodBtnClick}
                        className="text-xs underline text-gray-600"
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
        </FormModal>
    );
};

export default SettingModal;
