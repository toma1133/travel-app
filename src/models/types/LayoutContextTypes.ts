import { Dispatch, SetStateAction } from "react";

type LayoutContextType = {
    setIsPageLoading: Dispatch<SetStateAction<boolean>>;
};

export default LayoutContextType;
