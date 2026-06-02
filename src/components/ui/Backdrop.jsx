import { clsx } from "clsx";

export default function Backdrop({centered, children, className, ...rest}) {
    let classString = clsx('fixed inset-0 z-50 bg-black/50 overflow-hidden',
        centered && "flex items-center justify-center",
        className
    );

    return (
        <div className={classString} {...rest}>
            {children}
        </div>
    );
}