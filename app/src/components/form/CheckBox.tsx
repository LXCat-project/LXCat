import { ChangeEventHandler } from "react";

interface Props {
    name: string;
    checked?: boolean;
    label: string;
    onChange: ChangeEventHandler<HTMLInputElement>;
    disabled?: boolean;
}
export function CheckBox({ name, checked = false, label, onChange, disabled = false }: Props) {
    return (
        <label>
            <input
                id={label}
                type="checkbox"
                name={name}
                checked={checked}
                disabled={disabled} // TODO disable checkbox when other facets make this label unavailable
                onChange={onChange} />
            {label}
        </label>
    );
}
