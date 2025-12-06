import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import useAuth from "./auth/useAuth";
import LoginPage from "./components/page/LoginPage";
import BookPage from "./components/page/BookPage";
import BookshelfPage from "./components/page/BookshelfPage";
import PrintableFullPage from "./components/page/PrintableFullPage";
import { supabase } from "./db/supabase";
import "./App.css";

const STORAGE_KEYS = {
    activeTripId: "activeTripId",
    activeTab: "activeTab",
};

const AppContent = () => {
    const { session, loading, signOut } = useAuth();
    const [isOffline, setIsOffline] = useState(() => {
        if (typeof navigator === "undefined") return false;
        return !navigator.onLine;
    });
    const [isPrintMode, setIsPrintMode] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

    const [tripDataList, setTripDataList] = useState([]);
    const [activeTab, setActiveTab] = useState("cover");
    const [activeTrip, setActiveTrip] = useState(null);
    const [activePlaces, setActivePlaces] = useState(null);
    const [activeItinerary, setActiveItinerary] = useState(null);
    const [activeBudgetItems, setActiveBudgetItems] = useState(null);
    const [activeSettings, setActiveSettings] = useState(null);
    const [activePaymentMethods, setActivePaymentMethods] = useState(null);
    const [activeFlights, setActiveFlights] = useState(null);
    const [activeAccommodations, setActiveAccommodations] = useState(null);
    const [activeCarRentals, setActiveCarRentals] = useState(null);

    const [tripToPrint, setTripToPrint] = useState(null);

    useEffect(() => {
        const handleStatusChange = () => setIsOffline(!navigator.onLine);

        window.addEventListener("online", handleStatusChange);
        window.addEventListener("offline", handleStatusChange);

        return () => {
            window.removeEventListener("online", handleStatusChange);
            window.removeEventListener("offline", handleStatusChange);
        };
    }, []);

    useEffect(() => {
        if (!session || isOffline) return;

        (async () => {
            // trips
            const { data: remoteTrips } = await supabase
                .from("trips")
                .select("*");

            setTripDataList(remoteTrips);
        })();
    }, [session, isOffline]);

    useEffect(() => {
        (async () => {
            try {
                const storedTripId = localStorage.getItem(
                    STORAGE_KEYS.activeTripId
                );
                if (!storedTripId) {
                    setActiveTrip(null);
                    return;
                }
                // const found = tripDataList.find(
                //     (t) => String(t.id) === String(storedTripId)
                // );
                // handleSelectTrip(found || null);
            } catch {
                setActiveTrip(null);
            }
        })();
    }, [tripDataList]);

    // Back handler: Clear state and localStorage
    const handleBack = () => {
        setActiveTrip(null);
        setActivePlaces(null);
        setActiveItinerary(null);
        setActiveBudgetItems(null);
        setActivePaymentMethods(null);
        setActiveSettings(null);
        setActiveAccommodations(null);
        setActiveFlights(null);
        setActiveCarRentals(null);
        localStorage.removeItem("activeTripId");
        localStorage.removeItem("activeTab");
    };

    const handleSelectTrip = async (trip) => {
        if (!session || !trip) return;

        setDetailLoading(true);

        try {
            const promises = [
                supabase.from("places").select("*").eq("trip_id", trip.id),
                supabase
                    .from("itinerary_days")
                    .select("*")
                    .eq("trip_id", trip.id)
                    .order("date", { ascending: true })
                    .order("id", { ascending: true }),
                supabase
                    .from("payment_methods")
                    .select("*")
                    .eq("trip_id", trip.id)
                    .order("order", { ascending: true }),
                supabase
                    .from("budget_items")
                    .select("*")
                    .eq("trip_id", trip.id)
                    .order("expense_date", { ascending: true })
                    .order("id", { ascending: true }),
                supabase
                    .from("accommodations")
                    .select("*")
                    .eq("trip_id", trip.id),
                supabase.from("flights").select("*").eq("trip_id", trip.id),
                supabase.from("car_rentals").select("*").eq("trip_id", trip.id),
            ];

            const [
                placesResult,
                itineraryResult,
                paymentMethodsResult,
                budgetItemsResult,
                accommodationResult,
                flightsResult,
                carRentalResult,
            ] = await Promise.all(promises);

            const places = placesResult.data;
            const itinerary = itineraryResult.data;
            const paymentMethods = paymentMethodsResult.data;
            const budgetItems = budgetItemsResult.data;
            const accommodation = accommodationResult.data;
            const flights = flightsResult.data;
            const carRental = carRentalResult.data;

            setActiveTrip(trip);
            setActivePlaces(places);
            setActiveItinerary(itinerary);
            setActiveBudgetItems(budgetItems);
            setActivePaymentMethods(paymentMethods);
            setActiveSettings(trip.settings_config);
            setActiveAccommodations(accommodation);
            setActiveFlights(flights);
            setActiveCarRentals(carRental);
            setActiveTab(activeTab || "cover");
            localStorage.setItem("activeTripId", trip.id);
            localStorage.setItem("activeTab", activeTab);
        } catch (error) {
            console.error("Failed to load trip details in parallel:", error);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleAddBudgetItem = async (budgetItem: any) => {
        if (!activeTrip || !session) return;

        setDetailLoading(true);
        const { error } = await supabase.from("budget_items").insert({
            trip_id: activeTrip.id,
            payment_method_id: budgetItem.paymentId,
            title: budgetItem.title,
            amount: budgetItem.amount,
            currency_code: budgetItem.currency,
            category: budgetItem.category,
            expense_date: budgetItem.date,
            user_id: session.user.id,
        });

        // refresh
        const { data } = await supabase
            .from("budget_items")
            .select("*")
            .eq("trip_id", activeTrip.id)
            .order("expense_date", { ascending: true })
            .order("id", { ascending: true });

        setActiveBudgetItems(data);
        setDetailLoading(false);
    };

    const handleEditBudgetItem = async (budgetItem) => {
        if (!activeTrip || !session) return;

        setDetailLoading(true);
        const { error } = await supabase
            .from("budget_items")
            .update({
                payment_method_id: budgetItem.paymentId,
                title: budgetItem.title,
                amount: budgetItem.amount,
                currency_code: budgetItem.currency,
                category: budgetItem.category,
                expense_date: budgetItem.date,
            })
            .eq("id", budgetItem.id);

        // refresh
        const { data } = await supabase
            .from("budget_items")
            .select("*")
            .eq("trip_id", activeTrip.id)
            .order("expense_date", { ascending: true })
            .order("id", { ascending: true });

        setActiveBudgetItems(data);
        setDetailLoading(false);
    };

    const handleDeleteBudgetItem = async (budgetItemId) => {
        if (!activeTrip || !session) return;

        setDetailLoading(true);
        const { error } = await supabase
            .from("budget_items")
            .delete()
            .eq("id", budgetItemId);

        // refresh
        const { data } = await supabase
            .from("budget_items")
            .select("*")
            .eq("trip_id", activeTrip.id)
            .order("expense_date", { ascending: true })
            .order("id", { ascending: true });

        setActiveBudgetItems(data);
        setDetailLoading(false);
    };

    const handleEditSettings = async ({ settings, paymentMethods }) => {
        if (!activeTrip || !session) return;

        setDetailLoading(true);
        await supabase
            .from("trips")
            .update({
                settings_config: settings,
            })
            .eq("id", activeTrip.id);

        for (const paymentMethod of paymentMethods) {
            await supabase.from("payment_methods").upsert({
                id: paymentMethod.id,
                trip_id: activeTrip.id,
                name: paymentMethod.name,
                type: paymentMethod.type,
                currency_code: paymentMethod.currency_code,
                credit_limit: paymentMethod.credit_limit,
                order: paymentMethod.order,
                user_id: session.user.id,
            });
        }

        // refresh
        const { data: trips } = await supabase
            .from("trips")
            .select("*")
            .eq("id", activeTrip.id);
        const { data: updatedPaymentMethods } = await supabase
            .from("payment_methods")
            .select("*")
            .eq("trip_id", activeTrip.id)
            .order("order", { ascending: true });

        if (Array.isArray(trips) && trips.length === 1)
            setActiveSettings(trips[0].settings_config);

        if (Array.isArray(updatedPaymentMethods))
            setActivePaymentMethods(updatedPaymentMethods);

        setDetailLoading(false);
    };

    const handleResetSettings = async () => {
        if (!activeTrip || !session) return;

        setDetailLoading(true);

        // refresh
        const { data: trips } = await supabase
            .from("trips")
            .select("*")
            .eq("id", activeTrip.id);
        const { data: updatedPaymentMethods } = await supabase
            .from("payment_methods")
            .select("*")
            .eq("trip_id", activeTrip.id);

        if (Array.isArray(trips) && trips.length === 1)
            setActiveSettings(trips[0].settings_config);

        if (Array.isArray(updatedPaymentMethods))
            setActivePaymentMethods(updatedPaymentMethods);

        setDetailLoading(false);
    };

    // Handle Print Action (Now triggered from Bookshelf, passing the trip data)
    const handlePrintFullBook = async (trip) => {
        const promises = [
            supabase.from("places").select("*").eq("trip_id", trip.id),
            supabase
                .from("itinerary_days")
                .select("*")
                .eq("trip_id", trip.id)
                .order("date", { ascending: true })
                .order("id", { ascending: true }),
            supabase
                .from("payment_methods")
                .select("*")
                .eq("trip_id", trip.id)
                .order("order", { ascending: false }),
            supabase
                .from("budget_items")
                .select("*")
                .eq("trip_id", trip.id)
                .order("expense_date", { ascending: true })
                .order("id", { ascending: true }),
            supabase.from("accommodations").select("*").eq("trip_id", trip.id),
            supabase.from("flights").select("*").eq("trip_id", trip.id),
            supabase.from("car_rentals").select("*").eq("trip_id", trip.id),
        ];

        const [
            placesResult,
            itineraryResult,
            paymentMethodsResult,
            budgetItemsResult,
            accommodationResult,
            flightsResult,
            carRentalResult,
        ] = await Promise.all(promises);

        const places = placesResult.data;
        const itinerary = itineraryResult.data;
        const paymentMethods = paymentMethodsResult.data;
        const budgetItems = budgetItemsResult.data;
        const accommodation = accommodationResult.data;
        const flights = flightsResult.data;
        const carRental = carRentalResult.data;

        setTripToPrint({
            ...trip,
            places,
            itinerary,
            paymentMethods,
            budgetItems,
            accommodation,
            flights,
            carRental,
        });
        setIsPrintMode(true);

        // 延遲渲染 Full View，然後列印
        setTimeout(() => {
            window.print();
            // 列印對話框關閉後恢復原狀
            setIsPrintMode(false);
            setTripToPrint(null);
        }, 500);
    };

    const currentPrintData = useMemo(() => {
        return tripToPrint ? tripToPrint : null;
    }, [tripToPrint]);

    if (isPrintMode && currentPrintData) {
        return (
            <PrintableFullPage
                tripData={currentPrintData}
                theme={currentPrintData.theme_config}
            />
        );
    }

    if (!session) {
        return <LoginPage />;
    }

    return (
        <div className="mx-auto max-w-md shadow-2xl h-screen overflow-hidden relative">
            {(loading || detailLoading) && (
                <div className="flex justify-center items-center h-full w-full backdrop-blur-md absolute top-0 z-50">
                    <svg
                        className="text-gray-300 animate-spin"
                        viewBox="0 0 64 64"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                    >
                        <path
                            d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z"
                            stroke="currentColor"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        ></path>
                        <path
                            d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
                            stroke="currentColor"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-900"
                        ></path>
                    </svg>
                </div>
            )}
            {!isPrintMode && (
                <nav className="w-full shrink-0 flex justify-end items-end px-4 py-4 pb-3 absolute top-0 z-20">
                    {activeTrip && (
                        <button
                            onClick={handleBack}
                            className="absolute top-3 left-3 z-50 text-white/80 hover:text-white bg-black/20 backdrop-blur-md p-2 rounded-full"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div className="flex items-center gap-4">
                        <span
                            className={`text-xs px-2 py-1 rounded-full ${
                                isOffline
                                    ? "bg-gray-500/20 text-gray-300"
                                    : "bg-green-500/20 text-green-400"
                            }`}
                        >
                            {isOffline ? "OFFLINE" : "ONLINE"}
                        </span>
                        <button
                            onClick={signOut}
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            登出
                        </button>
                    </div>
                </nav>
            )}
            {activeTrip ? (
                <BookPage
                    key={activeTrip.id}
                    tripData={activeTrip}
                    initialTab={activeTab}
                    theme={activeTrip.theme_config}
                    places={activePlaces}
                    itinerary={activeItinerary}
                    budgetItems={activeBudgetItems}
                    paymentMethods={activePaymentMethods}
                    settings={activeSettings}
                    accommodations={activeAccommodations}
                    flights={activeFlights}
                    carRentals={activeCarRentals}
                    onAddBudgetItem={handleAddBudgetItem}
                    onEditBudgetItem={handleEditBudgetItem}
                    onDeleteBudgetItem={handleDeleteBudgetItem}
                    onEditSettings={handleEditSettings}
                    onResetSettings={handleResetSettings}
                />
            ) : (
                <BookshelfPage
                    tripDataList={tripDataList}
                    onSelectTrip={handleSelectTrip}
                    onPrintTrip={handlePrintFullBook}
                />
            )}
        </div>
    );
};

export default AppContent;
