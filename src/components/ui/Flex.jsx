import { clsx } from "clsx";

export function Flex({children, gap="gap-4", wrap, growChildren, className, ...rest}) {
    const classString = clsx([
        'flex',
        gap,
        wrap ? 'flex-wrap' : null,
        growChildren ? 'flex-expand' : null,
        className
    ]);
    return <div className={classString} {...rest}>{children}</div>;
}

export default Flex;
