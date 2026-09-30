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
            className={`md:hidden text-foreground/80 hover:text-foreground p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all shrink-0 cursor-pointer ${className || "-ml-2"}`}
        >
            {icon || <ArrowLeft size={20} />}
        </button>
    );
};

export default BackBtn;
