import { useState, useEffect } from "react";
import { RefreshCw, Trash2, X } from "lucide-react";

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
        Array.isArray(paymentMethods) ? paymentMethods : []
    );

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    useEffect(() => {
        setLocalPaymentMethods(paymentMethods);
    }, [paymentMethods]);

    const handlePaymentChange = (idx, field, value) => {
        const newMethods = [...localPaymentMethods];
        newMethods[idx] = { ...newMethods[idx], [field]: value };
        setLocalPaymentMethods(newMethods);
    };

    const addMethod = () => {
        const newMethod = {
            name: "新卡片",
            type: "credit",
            limit: 0,
            used: 0,
            currency: localSettings.homeCurrency,
        };
        setLocalPaymentMethods([...localPaymentMethods, newMethod]);
    };

    const removeMethod = (idx) => {
        const newMethods = localPaymentMethods.filter((_, i) => i !== idx);
        setLocalPaymentMethods(newMethods);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-[#F2F2F0] w-full max-w-sm rounded-none shadow-2xl p-6 border border-gray-700 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 border-b border-gray-300 pb-2">
                    <h3 className="font-serif font-bold text-xl text-gray-900">
                        系統設定
                    </h3>
                    <button onClick={onClose}>
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
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
                                className="w-full p-2 bg-white border border-gray-300 text-center font-mono text-sm"
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
                                className="w-full p-2 bg-white border border-gray-300 text-center font-mono text-sm"
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
                                    exchangeRate: parseFloat(e.target.value),
                                })
                            }
                            className="w-full p-2 bg-white border border-gray-300 font-mono text-sm"
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
                            onClick={addMethod}
                            className="text-[10px] underline text-gray-600"
                        >
                            新增
                        </button>
                    </div>
                    {Array.isArray(localPaymentMethods) &&
                        localPaymentMethods.map((method, idx) => (
                            <div
                                key={method.id}
                                className="bg-white p-3 border border-gray-200 shadow-sm space-y-2"
                            >
                                <div className="flex items-center justify-between">
                                    <input
                                        value={method.name}
                                        onChange={(e) =>
                                            handlePaymentChange(
                                                idx,
                                                "name",
                                                e.target.value
                                            )
                                        }
                                        className="font-bold text-sm bg-transparent border-none w-2/3 outline-none"
                                        placeholder="名稱"
                                    />
                                    {method.id !== "cash" && (
                                        <button
                                            onClick={() => removeMethod(idx)}
                                            className="text-gray-300 hover:text-red-500"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                                {method.type === "credit" && (
                                    <div className="flex items-center space-x-2">
                                        <span className="text-[10px] text-gray-400">
                                            額度/上限
                                        </span>
                                        <input
                                            type="number"
                                            value={method.credit_limit}
                                            onChange={(e) =>
                                                handlePaymentChange(
                                                    idx,
                                                    "credit_limit",
                                                    parseInt(e.target.value)
                                                )
                                            }
                                            className="w-full p-1 bg-gray-50 border-b border-gray-200 font-mono text-xs text-right"
                                            placeholder="無上限填 0"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
                <div className="space-y-3 pt-4 border-t border-gray-300">
                    <button
                        onClick={() => {
                            onSave({
                                settings: localSettings,
                                paymentMethods: localPaymentMethods,
                            });
                            onClose();
                        }}
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
            </div>
        </div>
    );
};

export default SettingsModal;
