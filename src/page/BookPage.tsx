import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { BookOpen, Info, Map, PieChart, Sun } from "lucide-react";
import { useBook } from "../hooks/page/UseBook";
import TabButton from "../components/common/TabButton";

const BookPage = () => {
    const { id: tripId } = useParams<{ id: string }>();
    const { data, isLoading, error } = useBook(tripId);
    const navigate = useNavigate();

    const handleTabBtnClick = (tabName: string) => {
        navigate(`/trip/${tripId}/${tabName}`, { replace: false });
    };

    return (
        <>
            {data && (
                <>
                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                        <Outlet />
                    </div>
                    {/* Styled Bottom Navigation */}
                    <div
                        className={`border-t border-gray-800 ${data.theme_config?.nav} px-6 pb-safe pt-1 shrink-0 z-40`}
                    >
                        <div className="flex justify-between items-center max-w-sm mx-auto">
                            <TabButton
                                to={`/trip/${tripId}/cover`}
                                icon={Sun}
                                label="首頁"
                                theme={data.theme_config}
                                end
                            />
                            <TabButton
                                to={`/trip/${tripId}/guide`}
                                icon={BookOpen}
                                label="景點"
                                theme={data.theme_config}
                            />
                            <TabButton
                                to={`/trip/${tripId}/itinerary`}
                                icon={Map}
                                label="行程"
                                theme={data.theme_config}
                            />
                            <TabButton
                                to={`/trip/${tripId}/budget`}
                                icon={PieChart}
                                label="帳本"
                                theme={data.theme_config}
                            />
                            <TabButton
                                to={`/trip/${tripId}/info`}
                                icon={Info}
                                label="資訊"
                                theme={data.theme_config}
                            />
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default BookPage;
