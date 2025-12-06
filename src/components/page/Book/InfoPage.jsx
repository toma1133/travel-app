import { Bed, Calendar, Car, MapPin, Plane } from "lucide-react";
import SectionHeader from "../../common/SectionHeader";

const InfoPage = ({
    accommodations,
    flights,
    carRentals,
    theme,
    isPrinting,
}) => (
    <div
        className={`min-h-full font-sans text-gray-800 ${
            isPrinting
                ? "p-4 h-auto min-h-[50vh] break-after-page overflow-visible print:bg-white"
                : `${theme.bg || "bg-gray-100"} py-12 pb-24`
        }`}
    >
        {!isPrinting && (
            <SectionHeader
                title="預訂資訊"
                subtitle="航班・住宿・租車"
                theme={theme}
            />
        )}
        <div className="px-4 space-y-6 print:space-y-4">
            <div className="bg-white p-5 rounded-lg shadow-sm break-inside-avoid-page print:shadow-none print:border print:border-gray-300 print:p-4">
                <div className="flex items-center mb-4 text-[#8E354A] print:text-gray-700">
                    <Plane size={18} className="mr-2" />
                    <h3 className="font-bold text-sm tracking-wider uppercase">
                        Flights
                    </h3>
                </div>
                {Array.isArray(flights) &&
                    flights.map((f, i) => (
                        <div
                            key={i}
                            className={`flex justify-between items-center text-sm py-2 print:py-1.5 print:text-gray-800 ${
                                i !== 0
                                    ? "border-t border-gray-100 print:border-gray-200"
                                    : ""
                            }`}
                        >
                            <div>
                                <div className="font-bold text-gray-800 print:text-base">
                                    {f.departure_loc} - {f.arrival_loc}
                                </div>
                                <div className="text-xs text-gray-400 print:text-gray-600">
                                    {f.flight_date}・{f.code}
                                </div>
                            </div>
                            <div className="font-mono text-gray-600 print:text-gray-800">
                                {f.departure_time} - {f.arrival_time}
                            </div>
                        </div>
                    ))}
            </div>
            {Array.isArray(carRentals) && carRentals.length == 1 && (
                <div className="bg-white p-5 rounded-lg shadow-sm break-inside-avoid-page print:shadow-none print:border print:border-gray-300 print:p-4">
                    <div className="flex items-center mb-4 text-[#8E354A] print:text-gray-700">
                        <Car size={18} className="mr-2" />
                        <h3 className="font-bold text-sm tracking-wider uppercase">
                            Rental Car
                        </h3>
                    </div>

                    <div className="text-sm">
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-500 print:text-gray-600">
                                租車公司
                            </span>
                            <span className="font-bold text-gray-800">
                                {carRentals[0].company}
                            </span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-500 print:text-gray-600">
                                車型
                            </span>
                            <span className="font-bold text-gray-800">
                                {carRentals[0].model}
                            </span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-500 print:text-gray-600">
                                保險
                            </span>
                            <span className="font-bold text-gray-800">
                                {carRentals[0].insurancePlan}
                            </span>
                        </div>
                        {/* 取還車細節 */}
                        <div className="bg-gray-50 p-3 rounded text-xs space-y-2 print:bg-white print:border print:border-gray-200 print:mt-4">
                            <div className="flex justify-between">
                                <span className="text-gray-400 print:text-gray-600">
                                    取車
                                </span>
                                <span className="text-gray-700 print:text-gray-800">
                                    {carRentals[0].pickup}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400 print:text-gray-600">
                                    還車
                                </span>
                                <span className="text-gray-700 print:text-gray-800">
                                    {carRentals[0].dropoff}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="bg-white p-5 rounded-lg shadow-sm break-inside-avoid-page print:shadow-none print:border print:border-gray-300 print:p-4">
                <div className="flex items-center mb-4 text-[#8E354A] print:text-gray-700">
                    <Bed size={18} className="mr-2" />
                    <h3 className="font-bold text-sm tracking-wider uppercase">
                        Hotels
                    </h3>
                </div>
                {Array.isArray(accommodations) &&
                    accommodations.map((h, i) => (
                        <div
                            key={i}
                            className={`mb-4 last:mb-0 ${
                                i !== 0
                                    ? "pt-4 border-t border-gray-100 print:border-gray-200"
                                    : ""
                            }`}
                        >
                            <div className="font-bold text-gray-800 text-sm mb-1 print:text-base">
                                {h.name}
                            </div>
                            <div className="flex items-start text-xs text-gray-500 print:text-gray-600">
                                <Calendar size={12} className="mr-1.5 mt-0.5" />
                                {h.check_in_date} - {h.check_out_date}
                            </div>
                            <div className="flex items-start text-xs text-gray-500 mt-1 print:text-gray-600">
                                <MapPin
                                    size={12}
                                    className="mr-1.5 mt-0.5 shrink-0"
                                />
                                <span className="truncate">{h.address}</span>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    </div>
);

export default InfoPage;
