import './PalettePicker.css';

export default function PalettePicker({
    label,
    colors = ["f00", "ff0", "0f0", "0ff", "00f", "f0f"],
    selectedColor,
    onChange,
    swatchWidth = "2.5rem",
    swatchHeight = "2.5rem"
}) {
    const handleSelect = (color) => {
        if (onChange) {
            onChange(color);
        }
    };

    return (
        <div className="palette-picker__container">
            {label && <label className="palette-picker__label">{label}</label>}
            <ul className="palette-picker">
                {colors.map(color => {
                    const isSelected = selectedColor === color;

                    return (
                        <li
                            key={color}
                            className={`swatch ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelect(color)}
                            style={{
                                width: swatchWidth,
                                height: swatchHeight,
                                backgroundColor: `#${color}`
                            }}
                            title={`#${color}`}
                        >
                            {/* Hidden radio for form compatibility */}
                            <input
                                type="radio"
                                value={color}
                                checked={isSelected}
                                onChange={() => handleSelect(color)}
                                className="sr-only"
                            />
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}