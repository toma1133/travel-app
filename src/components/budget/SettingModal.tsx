import { MouseEventHandler, FormEventHandler, ChangeEventHandler, useState } from "react";
import { DragEndEvent } from "@dnd-kit/core";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type {
    TripSettingConf,
    TripThemeConf,
} from "../../models/types/TripTypes";
import PaymentSettingList from "./PaymentSettingList";
import ExchangeRateSetting from "../common/ExchangeRateSetting";
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
    const [activeTab, setActiveTab] = useState<"exchange" | "payment">("exchange");
    return (
        <FormModal
            formId={"setting-form"}
            modalTitle={"系統設定"}
            modalSaveTitle={"儲存變更"}
            theme={theme}
            onCancelBtnClick={onCloseBtnClick}
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onFormSubmit}
        >
            {/* Tabs */}
            <div className="flex border-b border-border mb-6">
                <button
                    type="button"
                    onClick={() => setActiveTab("exchange")}
                    className={`flex-1 py-2 text-sm font-bold uppercase tracking-widest transition-colors ${
                        activeTab === "exchange"
                            ? "border-b-2 border-primary text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    匯率設定
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("payment")}
                    className={`flex-1 py-2 text-sm font-bold uppercase tracking-widest transition-colors ${
                        activeTab === "payment"
                            ? "border-b-2 border-primary text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    支付工具與額度
                </button>
            </div>

            {/* Content */}
            {activeTab === "exchange" && (
                <div className="mb-4">
                    <ExchangeRateSetting
                        homeCurrency={setting?.homeCurrency}
                        localCurrency={setting?.localCurrency}
                        exchangeRate={setting?.exchangeRate}
                        onSettingChange={(name, value) => {
                            // Creating a synthetic event-like structure for the existing handler
                            onSettingChange({
                                target: { name, value: String(value) },
                            } as React.ChangeEvent<HTMLInputElement>);
                        }}
                    />
                </div>
            )}

            {activeTab === "payment" && (
                <div className="mb-4 space-y-4">
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={onAddPaymentMethodBtnClick}
                            className="text-xs font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
                            title="新增支付工具"
                        >
                            + 新增支付工具
                        </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto no-scrollbar scroll-smooth">
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
            )}
        </FormModal>
    );
};

export default SettingModal;
