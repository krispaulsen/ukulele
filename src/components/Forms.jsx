
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

const Select = ({ id, label, value, options, ...rest }) => {
    return (
        <div className="form-control">
            {label && <label htmlFor={id}>{label}</label>}
            <select id={id} defaultValue={value} {...rest}>
                {options.map(option => {
                    return <option key={option.value} value={option.value}>{option.label}</option>
                })}
            </select>
        </div>
    );
};

const Textarea = ({ id, label, ...rest }) => {
    return (
        <div className="form-control">
            {label && <label htmlFor={id}>{label}</label>}
            <textarea id={id} {...rest}></textarea>
        </div>
    )
};

const Checkbox = ({ label, isChecked, ...rest }) => {
    return (
        <div className="form-control">
            <label>
                <input type="checkbox" checked={isChecked} {...rest} />
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
    Checkbox
}