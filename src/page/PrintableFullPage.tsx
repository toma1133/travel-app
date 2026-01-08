import CoverPage from "./Book/CoverPage";
import GuidePage from "./Book/GuidePage";
import ItineraryPage from "./Book/ItineraryPage";
import BudgetPage from "./Book/BudgetPage";
import InfoPage from "./Book/InfoPage";
import { TripVM } from "../models/types/TripTypes";

type PrintableFullPageProps = {
    tripData?: TripVM; 
};

const PrintableFullPage = ({ tripData }: PrintableFullPageProps) => { 
    const tripId = tripData?.id;

    return (
        <div className="bg-white text-black p-8 max-w-[210mm] mx-auto">
            <CoverPage isPrinting={true} tripIdOverride={tripId} tripDataOverride={tripData} />
            <div className="mt-8 break-before-page">
                <h3 className="text-lg font-[Noto_Sans_TC] font-bold mb-4">
                    行程表
                </h3>
                <ItineraryPage isPrinting={true} tripIdOverride={tripId} tripDataOverride={tripData} />
            </div>
            <div className="mt-8 break-before-page">
                <h3 className="text-lg font-[Noto_Sans_TC] font-bold mb-4">
                    消費總覽
                </h3>
                <BudgetPage isPrinting={true} tripIdOverride={tripId} tripDataOverride={tripData} />
            </div>
            <div className="mt-8 break-before-page">
                <h3 className="text-lg font-[Noto_Sans_TC] font-bold mb-4">
                    景點誌
                </h3>
                <GuidePage isPrinting={true} tripIdOverride={tripId} tripDataOverride={tripData} />
            </div>
            <div className="mt-8 break-before-page">
                <h3 className="text-lg font-[Noto_Sans_TC] font-bold mb-4">
                    預訂資訊
                </h3>
                <InfoPage isPrinting={true} tripIdOverride={tripId} tripDataOverride={tripData} />
            </div>
        </div>
    );
};

export default PrintableFullPage;
