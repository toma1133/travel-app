import { JSX } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type BackBtnProps = {
    className?: string;
    icon?: JSX.Element;
};

const BackBtn = ({ className, icon }: BackBtnProps) => {
    const navigate = useNavigate();

    return (
        <button
            type="button"
            onClick={() => navigate("/", { replace: false })}
            className={`text-foreground/80 hover:text-foreground p-2 -ml-2 rounded-full hover:bg-accent transition-colors shrink-0 ${className || ""}`}
        >
            {icon || <ArrowLeft size={20} />}
        </button>
    );
};

export default BackBtn;
