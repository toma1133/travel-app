import { useState, useEffect } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { GripVertical, RefreshCw, Trash2, X } from "lucide-react";
import PaymentSettingList from "./PaymentSettingList";

const SettingsModal = ({
    theme,
    settings,
    paymentMethods,
    isOpen,
    onClose,
    onSave,
    onReset,
}) => {
    const [localSettings, setLocalSettings] = useState(settings);
    const [localPaymentMethods, setLocalPaymentMethods] = useState(
        Array.isArray(paymentMethods) ? paymentMethods : [],
    );

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    useEffect(() => {
        setLocalPaymentMethods(paymentMethods);
    }, [paymentMethods]);

    const handleDragPaymentItem = ({ active, over }) => {
        if (over && active.id !== over.id) {
            const oldIndex = localPaymentMethods
                .map((m) => m.id)
                .indexOf(active.id);
            const newIndex = localPaymentMethods
                .map((m) => m.id)
                .indexOf(over.id);
            const afterDrag = arrayMove(
                localPaymentMethods,
                oldIndex,
                newIndex,
            );
            const finalizedMethods = afterDrag.map((method, index) => ({
                ...method,
                order: index, // Synchronize the explicit 'order' property with the final array index
            }));
            setLocalPaymentMethods(finalizedMethods);
        }
    };

    const handlePaymentChange = (idx, field, value) => {
        const newMethods = [...localPaymentMethods];
        newMethods[idx] = { ...newMethods[idx], [field]: value };
        setLocalPaymentMethods(newMethods);
    };

    const addMethod = () => {
        const newOrder = localPaymentMethods.length;
        const newMethod = {
            id: crypto.randomUUID(),
            name: "新卡片",
            type: "credit",
            credit_limit: 0,
            used: 0,
            currency: localSettings.homeCurrency,
            order: newOrder,
        };
        setLocalPaymentMethods([...localPaymentMethods, newMethod]);
    };

    const removeMethod = (idx) => {
        const newMethods = localPaymentMethods.filter((_, i) => i !== idx);
        const reorderedMethods = newMethods.map((method, index) => ({
            ...method,
            order: index,
        }));
        setLocalPaymentMethods(reorderedMethods);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        onSave({
            settings: localSettings,
            paymentMethods: localPaymentMethods,
        });

        onClose();
    };

    const movePaymentItem = (arr, from, to) => {
        const newArr = [...arr];
        const item = newArr.splice(from, 1)[0];
        newArr.splice(to, 0, item);
        return newArr;
    };

    const handlePaymentMoveUp = (index) => {
        if (index > 0) {
            setLocalPaymentMethods((prev) =>
                movePaymentItem(prev, index, index - 1),
            );
        }
    };

    const handlePaymentMoveDown = (index) => {
        if (index < paymentMethods.length - 1) {
            setLocalPaymentMethods((prev) =>
                movePaymentItem(prev, index, index + 1),
            );
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#F2F2F0] w-full max-w-sm p-6 rounded-t-2xl sm:rounded-none shadow-2xl animate-in slide-in-from-bottom border border-gray-600">
                <div className="flex justify-between items-center mb-6 border-b border-gray-300 pb-2">
                    <h3 className="font-[Noto_Sans_TC] font-bold text-xl text-gray-900">
                        系統設定
                    </h3>
                    <button onClick={onClose}>
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
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
                                    value={localSettings.homeCurrency}
                                    onChange={(e) =>
                                        setLocalSettings({
                                            ...localSettings,
                                            homeCurrency: e.target.value,
                                        })
                                    }
                                    className="w-full bg-white border border-gray-300 p-3 font-mono text-2xl text-right font-bold outline-none focus:border-black"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-1">
                                    當地幣 (Local)
                                </label>
                                <input
                                    type="text"
                                    value={localSettings.localCurrency}
                                    onChange={(e) =>
                                        setLocalSettings({
                                            ...localSettings,
                                            localCurrency: e.target.value,
                                        })
                                    }
                                    className="w-full bg-white border border-gray-300 p-3 font-mono text-2xl text-right font-bold outline-none focus:border-black"
                                />
                            </div>
                        </div>
                        <div className="relative">
                            <label className="block text-[10px] text-gray-500 mb-1">
                                匯率 (1 {localSettings.localCurrency} = ?{" "}
                                {localSettings.homeCurrency})
                            </label>
                            <input
                                type="number"
                                step="1"
                                value={localSettings.exchangeRate}
                                onChange={(e) =>
                                    setLocalSettings({
                                        ...localSettings,
                                        exchangeRate: parseFloat(
                                            e.target.value,
                                        ),
                                    })
                                }
                                className="w-full bg-white border border-gray-300 p-3 font-mono text-2xl text-right font-bold outline-none focus:border-black"
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
                                onClick={addMethod}
                                className="text-[10px] underline text-gray-600"
                            >
                                新增
                            </button>
                        </div>
                        <div className="max-h-50 overflow-y-auto no-scrollbar scroll-smooth">
                            <PaymentSettingList
                                settings={localSettings}
                                paymentMethods={localPaymentMethods}
                                onPaymentChange={handlePaymentChange}
                                onPaymentRemove={removeMethod}
                                onDragPaymentItem={handleDragPaymentItem}
                                onPaymentMoveUp={handlePaymentMoveUp}
                                onPaymentMoveDown={handlePaymentMoveDown}
                            />
                        </div>
                    </div>
                    <div className="space-y-3 pt-4 border-t border-gray-300">
                        <button
                            type="submit"
                            className={`w-full py-3 ${theme.accent} text-white font-bold text-sm tracking-widest`}
                        >
                            儲存變更
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm("確定重置？")) {
                                    onReset();
                                    onClose();
                                }
                            }}
                            className="w-full py-3 bg-transparent text-gray-400 text-xs flex justify-center items-center hover:text-red-500"
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

export default SettingsModal;
