import { useEffect } from "react";
import { clsx } from "clsx";
import Backdrop from "./Backdrop";
import { IconButton } from "@material-tailwind/react";

export default function Modal({
    isOpen,
    onClose,
    header,
    position,
    isDismissable = true,
    closeOnBackdrop = true,
    showCloseBtn = true,
    className,
    children
}) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen && isDismissable) document.addEventListener("keydown", handleEscape);

        return () => document.removeEventListener("keydown", handleEscape);
    }, [isDismissable, isOpen, onClose]);

    if (!isOpen) return null;

    let classString = clsx("absolute m-4 bg-taupe-800 rounded-2xl shadow-xl overflow-hidden",
        position === "center" && "w-full"
        ["center", "left", "right"].includes(position) && "max-w-md",
        ["right", "left", "top"].includes(position) && "top-0",
        ["right", "top", "bottom"].includes(position) && "right-0",
        ["left", "top", "bottom"].includes(position) && "left-0",
        ["right", "left", "bottom"].includes(position) && "bottom-0",
        className
    );

    return (
        <Backdrop centered={position === "center"} onClick={isDismissable && closeOnBackdrop ? onClose : null}>
            <div 
                className={classString}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                {(header || showCloseBtn) && (
                    <div className="p-4 flex items-center justify-between">
                        <h3 className="text-xl font-semibold">{header}</h3>
                        {isDismissable && showCloseBtn && <IconButton  onClick={onClose} color="secondary" variant="outlined" className="border-0">
                            <i className="fa-solid fa-xmark"></i>
                        </IconButton>}
                    </div>
                )}

                {/* Content */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </Backdrop>
    );
}