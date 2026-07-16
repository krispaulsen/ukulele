import { useId, useState } from "react";
import { Flex } from "./ui"

function emitCheckedChange(onChange, checked, name) {
    onChange?.({
        target: { checked, type: "checkbox", name },
        currentTarget: { checked, type: "checkbox", name },
    });
}

const Form = ({ children, ...rest }) => {
    return <form {...rest}>{children}</form>
};

const Input = ({ type = "text", id, label, wrapperClassName, ...rest }) => {
    const inputId = id ?? useId();

    return (
        <div className={`form-control ${wrapperClassName}`}>
            {label && <label htmlFor={inputId}>{label}</label>}
            <input id={inputId} type={type} {...rest} />
        </div>
    );
};

const Select = ({ id, label, value, options = [], wrapperClassName, children, ...rest }) => {
    const inputId = id ?? useId();
    // Controlled when `value` is provided; otherwise allow uncontrolled via defaultValue in rest
    const valueProps = value !== undefined ? { value } : {};

    return (
        <div className={`form-control ${wrapperClassName}`}>
            {label && <label htmlFor={inputId}>{label}</label>}
            <select id={inputId} {...valueProps} {...rest}>
                {children}
                {options.map(option => {
                    if (typeof option === "string") return <option key={option} value={option}>{option}</option>
                    return <option key={option.value} value={option.value}>{option.label ?? option.value}</option>
                })}
            </select>
        </div>
    );
};

const Option = ({ value, children }) => {
    return <option value={value}>{children}</option>
}

const Textarea = ({ id, label, ...rest }) => {
    const inputId = id ?? useId();

    return (
        <div className="form-control">
            {label && <label htmlFor={inputId}>{label}</label>}
            <textarea id={inputId} {...rest}></textarea>
        </div>
    )
};

const Checkbox = ({ label, checked, ...rest }) => {
    const [isChecked, setIsChecked] = useState(checked || false);

    const handleToggle = () => {
        setIsChecked(!isChecked);
    }

    return (
        <div className="form-control">
            <label>
                <input type="checkbox" checked={isChecked} onChange={handleToggle} className="hidden" {...rest} />
                <i className={isChecked ? "fa-solid fa-square-check" : "fa-regular fa-square"}></i>
                {label}
            </label>
        </div>
    );
}

const Switch = ({
    option0 = "off",
    option1 = "on",
    checked = false,
    onChange,
    id,
    name,
    disabled = false,
    wrapperClassName = "",
    ...rest
}) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const isOn = !!checked;

    const handleInputChange = (event) => {
        onChange?.(event);
    };

    const handleSetOff = () => {
        if (disabled) return;
        emitCheckedChange(onChange, false, name);
    };

    const handleSetOn = () => {
        if (disabled) return;
        emitCheckedChange(onChange, true, name);
    };

    const sideLabelClass = (active) =>
        [
            "select-none text-sm transition-colors",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            active ? "font-semibold text-teal-700 dark:text-teal-300" : "text-taupe-600 dark:text-taupe-400",
        ].join(" ");

    return (
        <Flex gap="gap-2" className={`form-control items-center ${wrapperClassName}`}>
            <button
                type="button"
                className={sideLabelClass(!isOn)}
                onClick={handleSetOff}
                disabled={disabled}
                aria-pressed={!isOn}
            >
                {option0}
            </button>

            <label
                htmlFor={inputId}
                className={disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
            >
                <input
                    id={inputId}
                    type="checkbox"
                    role="switch"
                    className="peer sr-only"
                    checked={isOn}
                    onChange={handleInputChange}
                    disabled={disabled}
                    name={name}
                    {...rest}
                />
                <span
                    className={[
                        "relative block h-6 w-11 rounded-full transition-colors",
                        "bg-taupe-400 dark:bg-taupe-700",
                        "peer-checked:bg-teal-600 dark:peer-checked:bg-teal-700",
                        "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal-500",
                        "after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full",
                        "after:bg-white after:shadow after:transition-transform",
                        "peer-checked:after:translate-x-5",
                    ].join(" ")}
                    aria-hidden="true"
                />
            </label>

            <button
                type="button"
                className={sideLabelClass(isOn)}
                onClick={handleSetOn}
                disabled={disabled}
                aria-pressed={isOn}
            >
                {option1}
            </button>
        </Flex>
    )
}

export {
    Form,
    Input,
    Select,
    Textarea,
    Option,
    Checkbox,
    Switch
}