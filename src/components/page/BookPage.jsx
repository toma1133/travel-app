import { useEffect, useState } from "react";
import { Sun, BookOpen, Map, PieChart, Info } from "lucide-react";
import CoverPage from "./Book/CoverPage";
import GuidePage from "./Book/GuidePage";
import ItineraryPage from "./Book/ItineraryPage";
import BudgetPage from "./Book/BudgetPage";
import InfoPage from "./Book/InfoPage";
import Modal from "../common/Modal";
import PlaceCard from "../common/PlaceCard";
import TabButton from "../common/TabButton";

const BookPage = ({
    tripData,
    theme,
    places,
    itinerary,
    budgetItems,
    settings,
    paymentMethods,
    flights,
    accommodations,
    carRentals,
    initialTab,
    onAddBudgetItem,
    onEditBudgetItem,
    onDeleteBudgetItem,
    onEditSettings,
    onResetSettings,
}) => {
    const [activeTab, setActiveTab] = useState(initialTab || "cover");
    const [targetPlace, setTargetPlace] = useState(null);

    const closePlaceModal = () => {
        setTargetPlace(null);
    };

    useEffect(() => {
        localStorage.setItem("activeTripId", tripData.id);
        localStorage.setItem("activeTab", activeTab);
    }, [tripData, activeTab]);

    const handleNavigateToPlace = (linkId) => {
        var place = places.find((p) => p.id === linkId);
        if (place) setTargetPlace(place);
    };
    const handleAddBudgetItem = (newItem) => {
        onAddBudgetItem(newItem);
    };
    const handleEditBudgetItem = (updatedItem) => {
        onEditBudgetItem(updatedItem);
    };
    const handleDeleteBudgetItem = (id) => {
        onDeleteBudgetItem(id);
    };
    const handleEditSetting = (updatedSettings) => {
        onEditSettings(updatedSettings);
    };
    const handleReset = () => {
        onResetSettings();
    };
    const renderContent = () => {
        switch (activeTab) {
            case "guide":
                return (
                    <GuidePage
                        places={places}
                        theme={theme}
                        isPrinting={false}
                    />
                );
            case "itinerary":
                return (
                    <ItineraryPage
                        theme={theme}
                        itinerary={itinerary}
                        isPrinting={false}
                        onNavigateToPlace={handleNavigateToPlace}
                    />
                );
            case "budget":
                return (
                    <BudgetPage
                        theme={theme}
                        budgetItems={budgetItems}
                        settings={settings}
                        paymentMethods={paymentMethods}
                        isPrinting={false}
                        onAdd={handleAddBudgetItem}
                        onDelete={handleDeleteBudgetItem}
                        onEdit={handleEditBudgetItem}
                        setSettings={handleEditSetting}
                        resetData={handleReset}
                    />
                );
            case "info":
                return (
                    <InfoPage
                        accommodations={accommodations}
                        flights={flights}
                        carRentals={carRentals}
                        theme={theme}
                        isPrinting={false}
                    />
                );
            case "cover":
            default:
                return (
                    <CoverPage
                        tripData={tripData}
                        theme={theme}
                        isPrinting={false}
                    />
                );
        }
    };

    return (
        <div
            className={`h-screen w-full bg-[#F9F8F6] font-sans text-gray-800 overflow-hidden flex flex-col mx-auto max-w-md shadow-2xl relative`}
        >
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                {renderContent()}
            </div>
            {/* Styled Bottom Navigation */}
            <div
                className={`border-t border-gray-800 ${theme.nav} px-6 pb-safe pt-1 shrink-0 z-40`}
            >
                <div className="flex justify-between items-center max-w-sm mx-auto">
                    <TabButton
                        active={activeTab === "cover"}
                        onClick={() => setActiveTab("cover")}
                        icon={Sun}
                        label="首頁"
                        theme={theme}
                    />
                    <TabButton
                        active={activeTab === "guide"}
                        onClick={() => setActiveTab("guide")}
                        icon={BookOpen}
                        label="景點"
                        theme={theme}
                    />
                    <TabButton
                        active={activeTab === "itinerary"}
                        onClick={() => setActiveTab("itinerary")}
                        icon={Map}
                        label="行程"
                        theme={theme}
                    />
                    <TabButton
                        active={activeTab === "budget"}
                        onClick={() => setActiveTab("budget")}
                        icon={PieChart}
                        label="帳本"
                        theme={theme}
                    />
                    <TabButton
                        active={activeTab === "info"}
                        onClick={() => setActiveTab("info")}
                        icon={Info}
                        label="資訊"
                        theme={theme}
                    />
                </div>
            </div>
            {/* Modal 彈窗 */}
            <Modal isOpen={!!targetPlace} onClose={closePlaceModal}>
                <PlaceCard place={targetPlace} theme={theme} />
            </Modal>
        </div>
    );
};

export default BookPage;
