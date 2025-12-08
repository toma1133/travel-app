import CoverPage from "./Book/CoverPage";
import GuidePage from "./Book/GuidePage";
import ItineraryPage from "./Book/ItineraryPage";
import BudgetPage from "./Book/BudgetPage";
import InfoPage from "./Book/InfoPage";

const PrintableFullPage = ({ tripData, theme }) => (
    <div className="bg-white text-black p-8 max-w-[210mm] mx-auto">
        <CoverPage
            tripData={tripData}
            theme={theme}
            isPrinting={true}
            onBack={() => {}}
        />
        <div className="mt-8 break-before-page">
            <h3 className="text-lg font-[Noto_Sans_TC] font-bold mb-4">
                行程表
            </h3>
            <ItineraryPage
                itinerary={tripData.itinerary}
                theme={theme}
                isPrinting={true}
            />
        </div>
        <div className="mt-8 break-before-page">
            <h3 className="text-lg font-[Noto_Sans_TC] font-bold mb-4">
                消費總覽
            </h3>
            <BudgetPage
                budgetItems={tripData.budgetItems}
                settings={tripData.settings_config}
                paymentMethods={tripData.paymentMethods}
                setTripData={() => {}}
                theme={theme}
                isPrinting={true}
            />
        </div>
        <div className="mt-8 break-before-page">
            <h3 className="text-lg font-[Noto_Sans_TC] font-bold mb-4">
                景點誌
            </h3>
            <GuidePage
                places={tripData.places}
                theme={theme}
                isPrinting={true}
            />
        </div>
        <div className="mt-8 break-before-page">
            <h3 className="text-lg font-[Noto_Sans_TC] font-bold mb-4">
                預訂資訊
            </h3>
            <InfoPage
                accommodations={tripData.accommodation}
                flights={tripData.flights}
                carRentals={tripData.carRental}
                theme={theme}
                isPrinting={true}
            />
        </div>
    </div>
);

export default PrintableFullPage;
