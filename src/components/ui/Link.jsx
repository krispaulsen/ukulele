import { Link as ReactLink } from "react-router-dom";
import { clsx } from "clsx";


export const Link = ({ variant = "link", className, children, ...rest }) => {
    const styles = {
        default: [],
        button: [
            'inline-block',
            'px-4',
            'py-2',
            'border-2',
            'rounded-md',
        ],
        "button-primary": [
            'bg-orange-900',
            'text-orange-100',
            'border-orange-800',
            'hover:bg-orange-800'
        ]
    };

    const classString = variant === "link" ?
        clsx(...styles.default, className) :
        clsx(...styles.button, ...styles[variant], className);

    return <ReactLink className={classString} {...rest}>{children}</ReactLink>
};

export default Link;