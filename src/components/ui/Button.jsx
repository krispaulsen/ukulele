import { clsx } from "clsx";

export const ToggleButton = ({ isActive = false, className, children, ...rest }) => {
    // TODO: make a visual distinction between active and not active
    const classString = clsx('', className);
    return (
        <button
            type="button"
            className={classString}
            {...rest}
        >{children}</button>
    );
};

export const Button = ({ variant = "primary", type = "button", className, children, ...rest }) => {
    const styles = {
        default: [
            'px-4',
            'py-2',
            'border-2',
            'rounded-md',
        ],
        primary: [
            'bg-orange-900',
            'text-orange-100',
            'border-orange-800',
            'hover:bg-orange-800'
        ],
        secondary: [
            'bg-indigo-900',
            'text-indigo-100',
            'border-indigo-600',
            'hover:bg-indigo-800'
        ],
        link: [
            'd-inline',
            'px-0',
            'py-0',
            'bg-transparent',
            'border-0',
            'text-orange-300',
            'hover:underline',
            'hover:text-orange-400',
            'cursor-pointer',
        ]
    };

    const classString = variant === 'link' ?
        clsx(...styles.link, className) :
        clsx(...styles.default, ...styles[variant], className)

    return (
        <button
            type={type}
            className={classString}
            {...rest}
        >{children}</button>
    );
}

export default Button;