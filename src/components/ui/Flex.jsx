import { clsx } from "clsx";

export function Flex({children, gap=4, wrap, growChildren, className, ...rest}) {
    const classString = clsx([
        'flex',
        `gap-${gap}`,
        wrap ? 'wrap' : null,
        growChildren ? 'flex-expand' : null,
        className
    ]);
    return <div className={classString} {...rest}>{children}</div>;
}

export default Flex;
