import {
    Navigate,
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoginPage from "./page/LoginPage";
import ProtectedLayout from "./page/ProtectedLayout";
import BookPage from "./page/BookPage";
import BookshelfPage from "./page/BookshelfPage";
import CoverPage from "./page/Book/CoverPage";
import GuidePage from "./page/Book/GuidePage";
import ItineraryPage from "./page/Book/ItineraryPage";
import InfoPage from "./page/Book/InfoPage";
import "./App.css";
import BudgetPage from "./page/Book/BudgetPage";
import RouteErrorBoundary from "./components/common/RouteErrorBoundary";

const qc = new QueryClient();

const AppContent = ({ isOffline }: { isOffline: boolean }) => {
    const basename = import.meta.env.PROD ? "/travel-app" : undefined;

    const router = createBrowserRouter(
        [
            {
                path: "/",
                errorElement: <RouteErrorBoundary />,
                Component: () => <Navigate to="/trip" replace />,
            },
            {
                path: "/login",
                errorElement: <RouteErrorBoundary />,
                Component: () => <LoginPage />,
            },
            {
                errorElement: <RouteErrorBoundary />,
                Component: () => <ProtectedLayout isOffline={isOffline} />,
                children: [
                    {
                        path: "/trip",
                        errorElement: <RouteErrorBoundary />,
                        Component: () => <BookshelfPage />,
                    },
                    {
                        path: "/trip/:id",
                        errorElement: <RouteErrorBoundary />,
                        Component: () => <BookPage />,
                        children: [
                            {
                                index: true,
                                Component: () => (
                                    <Navigate to="cover" replace />
                                ),
                            },
                            {
                                path: "cover",
                                Component: () => <CoverPage />,
                            },
                            {
                                path: "guide",
                                Component: () => <GuidePage />,
                            },
                            {
                                path: "itinerary",
                                Component: () => <ItineraryPage />,
                            },
                            {
                                path: "budget",
                                Component: () => <BudgetPage />,
                            },
                            {
                                path: "info",
                                Component: () => <InfoPage />,
                            },
                            {
                                path: "*",
                                Component: () => (
                                    <div className="px-4 py-16">頁面不存在</div>
                                ),
                            },
                        ],
                    },
                ],
            },
            {
                path: "*",
                errorElement: <RouteErrorBoundary />,
                Component: () => <div>頁面不存在</div>,
            },
        ],
        {
            basename,
        }
    );

    return (
        <QueryClientProvider client={qc}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    );
};

export default AppContent;
