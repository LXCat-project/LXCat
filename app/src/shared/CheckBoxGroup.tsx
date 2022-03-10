import { ChangeEvent } from "react";
import { CheckBox } from "./CheckBox";

interface Props {
    name: string;
    choices: string[];
    selected: Set<string>;
    setSelected: (s: Set<string>) => void;
    enabled: string[]
}
export function CheckBoxGroup({ name, choices, selected, setSelected, enabled }: Props) {
    function onCheckBoxChange(event: ChangeEvent<HTMLInputElement>) {
        const id = event.target.id;
        const newSelection = new Set(selected);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelected(newSelection);
    }

    function selectAll() {
        setSelected(new Set(choices));
    }
    function selectNone() {
        setSelected(new Set());
    }
    function selectInvert() {
        const newSelection = choices.filter(d => !selected.has(d));
        setSelected(new Set(newSelection));
    }
    const boxes = choices.map(f => (
        <CheckBox
            key={f}
            name={name}
            label={f}
            onChange={onCheckBoxChange}
            disabled={!(enabled.includes(f))}
            checked={selected.has(f)} />
    ));
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                {boxes}
            </div>
            <div>
                <button onClick={selectAll}>All</button>
                <button onClick={selectNone}>None</button>
                <button onClick={selectInvert}>Invert</button>
            </div>
        </div>
    );
}
