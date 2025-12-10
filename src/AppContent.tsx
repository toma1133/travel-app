import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

const qc = new QueryClient();

const AppContent = ({ isOffline }: { isOffline: boolean }) => {
    return (
        <QueryClientProvider client={qc}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/trip" replace />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route element={<ProtectedLayout isOffline={isOffline} />}>
                        <Route path="/trip" element={<BookshelfPage />} />
                        <Route path="/trip/:id" element={<BookPage />}>
                            <Route
                                index
                                element={<Navigate to="cover" replace />}
                            />
                            <Route path="cover" element={<CoverPage />} />
                            <Route path="guide" element={<GuidePage />} />
                            <Route
                                path="itinerary"
                                element={<ItineraryPage />}
                            />
                            <Route path="info" element={<InfoPage />} />
                            <Route
                                path="*"
                                element={
                                    <div className="px-4 py-16">頁面不存在</div>
                                }
                            />
                        </Route>
                    </Route>
                    <Route path="*" element={<div>頁面不存在</div>} />
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
};

export default AppContent;
