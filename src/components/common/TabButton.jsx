import { Icon } from "lucide-react";

const TabButton = ({ active, icon: Icon, label, theme, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-full py-3 transition-all duration-300 ${
            active ? theme.navTextActive : theme.navTextInactive
        }`}
    >
        <Icon size={22} strokeWidth={active ? 2.5 : 2} className="mb-1" />
        <span className="text-[10px] font-medium tracking-wider">{label}</span>
    </button>
);

export default TabButton;
