import { useState, useEffect } from "react";
import { GripVertical, RefreshCw, Trash2, X } from "lucide-react";

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
    const [draggedIndex, setDraggedIndex] = useState(null);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    useEffect(() => {
        setLocalPaymentMethods(paymentMethods);
    }, [paymentMethods]);

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Set a small delay to hide the original element after drag starts, avoiding visual flicker
        setTimeout(() => {
            e.target.style.opacity = "0.3";
        }, 0);
    };

    const handleDragEnter = (index) => {
        if (draggedIndex === null || draggedIndex === index) return;

        // Create a new array and reorder the elements
        const newMethods = [...localPaymentMethods];
        const draggedItem = newMethods[draggedIndex];

        // Perform the move operation
        newMethods.splice(draggedIndex, 1); // Remove from old position
        newMethods.splice(index, 0, draggedItem); // Insert into new position

        // Update state and the index of the element currently being dragged over
        // NOTE: The actual 'order' property update will happen in handleDragEnd
        setLocalPaymentMethods(newMethods);
        setDraggedIndex(index);
    };

    const handleDragEnd = (e) => {
        // Reset opacity
        e.target.style.opacity = "1";

        // 1. Finalize the order property based on the current array index
        const finalizedMethods = localPaymentMethods.map((method, index) => ({
            ...method,
            order: index, // Synchronize the explicit 'order' property with the final array index
        }));

        // 2. Set the state with the finalized 'order' values
        setLocalPaymentMethods(finalizedMethods);

        // 3. Reset dragged index
        setDraggedIndex(null);
    };

    const handlePaymentChange = (idx, field, value) => {
        const newMethods = [...localPaymentMethods];
        newMethods[idx] = { ...newMethods[idx], [field]: value };
        setLocalPaymentMethods(newMethods);
    };

    const addMethod = () => {
        const newOrder = localPaymentMethods.length;
        const newMethod = {
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#F2F2F0] w-full max-w-sm p-6 rounded-t-2xl sm:rounded-none shadow-2xl animate-in slide-in-from-bottom border border-gray-600">
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
                    <div className="max-h-40 overflow-y-auto no-scrollbar scroll-smooth">
                        {Array.isArray(localPaymentMethods) &&
                            localPaymentMethods.map((method, idx) => (
                                <div
                                    key={method.id}
                                    className={`
                                        bg-white p-3 rounded-lg border border-gray-200 shadow-md space-y-2 cursor-move transition-all duration-150 ease-in-out
                                        ${
                                            draggedIndex === idx
                                                ? "opacity-30 border-dashed border-2 border-blue-400 scale-[0.98]"
                                                : "hover:shadow-lg"
                                        }
                                    `}
                                    draggable="true"
                                    onDragStart={(e) => handleDragStart(e, idx)}
                                    onDragEnter={() => handleDragEnter(idx)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDragEnd={handleDragEnd}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2 w-3/4">
                                            <GripVertical
                                                size={16}
                                                className="text-gray-400 flex-shrink-0"
                                            />
                                            <input
                                                value={method.name || ""}
                                                onChange={(e) =>
                                                    handlePaymentChange(
                                                        idx,
                                                        "name",
                                                        e.target.value
                                                    )
                                                }
                                                className="font-bold text-sm bg-transparent border-b border-gray-100 focus:border-blue-300 w-full outline-none p-1 -m-1"
                                                placeholder="名稱"
                                            />
                                        </div>
                                        {method.id !== "cash" &&
                                            method.type !== "cash" && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent drag interaction when clicking trash
                                                        removeMethod(idx);
                                                    }}
                                                    className="text-gray-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors flex-shrink-0"
                                                    aria-label="刪除此支付方式"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                    </div>
                                    {(method.type === "credit" ||
                                        method.type === "debit") && (
                                        <div className="flex items-center space-x-2 pt-2 ">
                                            <span className="text-[10px] text-gray-500 uppercase">
                                                額度/上限 (
                                                {method.currency ||
                                                    localSettings.homeCurrency ||
                                                    "---"}
                                                )
                                            </span>
                                            <input
                                                type="number"
                                                value={method.credit_limit || 0}
                                                onChange={(e) =>
                                                    handlePaymentChange(
                                                        idx,
                                                        "credit_limit",
                                                        parseInt(
                                                            e.target.value
                                                        ) || 0
                                                    )
                                                }
                                                className="w-full p-1 bg-gray-50 rounded-md border border-gray-200 font-mono text-xs text-right outline-none focus:border-blue-500"
                                                placeholder="無上限填 0"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
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
