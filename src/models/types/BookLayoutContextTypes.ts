import { Dispatch, SetStateAction } from "react";
import { TripVM } from "./TripTypes";

type BookLayoutContextType = {
    tripData: TripVM;
    setIsPageLoading: Dispatch<SetStateAction<boolean>>;
};

export default BookLayoutContextType;
