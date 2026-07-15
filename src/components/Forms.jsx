import { useId, useState } from "react";

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

const Select = ({ id, label, value, options = [], children, ...rest }) => {
    const inputId = id ?? useId();

    return (
        <div className="form-control">
            {label && <label htmlFor={inputId}>{label}</label>}
            <select id={inputId} defaultValue={value} {...rest}>
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

export {
    Form,
    Input,
    Select,
    Textarea,
    Option,
    Checkbox
}