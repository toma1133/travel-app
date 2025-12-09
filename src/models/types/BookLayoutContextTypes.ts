import { Dispatch, SetStateAction } from "react";
import { TripVM } from "./TripsTypes";

type BookLayoutContextType = {
    tripData: TripVM;
    setIsPageLoading: Dispatch<SetStateAction<boolean>>;
};

export default BookLayoutContextType;
