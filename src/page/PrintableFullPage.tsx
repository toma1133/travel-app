import CoverPage from "./Book/CoverPage";
import GuidePage from "./Book/GuidePage";
import ItineraryPage from "./Book/ItineraryPage";
import BudgetPage from "./Book/BudgetPage";
import InfoPage from "./Book/InfoPage";

const PrintableFullPage = () => (
    <div className="bg-white text-black p-8 max-w-[210mm] mx-auto">
        <CoverPage isPrinting={true} />
        <div className="mt-8 break-before-page">
            <h3 className="text-lg font-[Noto_Sans_TC] font-bold mb-4">
                行程表
            </h3>
            <ItineraryPage isPrinting={true} />
        </div>
        <div className="mt-8 break-before-page">
            <h3 className="text-lg font-[Noto_Sans_TC] font-bold mb-4">
                消費總覽
            </h3>
            <BudgetPage isPrinting={true} />
        </div>
        <div className="mt-8 break-before-page">
            <h3 className="text-lg font-[Noto_Sans_TC] font-bold mb-4">
                景點誌
            </h3>
            <GuidePage isPrinting={true} />
        </div>
        <div className="mt-8 break-before-page">
            <h3 className="text-lg font-[Noto_Sans_TC] font-bold mb-4">
                預訂資訊
            </h3>
            <InfoPage isPrinting={true} />
        </div>
    </div>
);

export default PrintableFullPage;
