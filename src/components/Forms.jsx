import { useState } from "react";

const Form = ({ children, ...rest }) => {
    return <form {...rest}>{children}</form>
};

const Input = ({ type = "text", id, label, ...rest }) => {
    return (
        <div className="form-control">
            {label && <label htmlFor={id}>{label}</label>}
            <input id={id} type={type} {...rest} />
        </div>
    );
};

const Select = ({ id, label, value, options = [], children, ...rest }) => {
    return (
        <div className="form-control">
            {label && <label htmlFor={id}>{label}</label>}
            <select id={id} defaultValue={value} {...rest}>
                {children}
                {options.map(option => {
                    return <option key={option.value} value={option.value}>{option.label}</option>
                })}
            </select>
        </div>
    );
};

const Option = ({ value, children }) => {
    return <option value={value}>{children}</option>
}

const Textarea = ({ id, label, ...rest }) => {
    return (
        <div className="form-control">
            {label && <label htmlFor={id}>{label}</label>}
            <textarea id={id} {...rest}></textarea>
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