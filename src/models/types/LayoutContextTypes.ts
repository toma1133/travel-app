import { Dispatch, SetStateAction } from "react";

export type LayoutContextType = {
    setIsPageLoading: Dispatch<SetStateAction<boolean>>;
}
