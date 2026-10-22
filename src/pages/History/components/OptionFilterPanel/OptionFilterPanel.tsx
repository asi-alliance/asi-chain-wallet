import { FC } from "react";
import { OptionList, PresetButton } from "../filterPanelStyles";

interface IFilterOption {
    id: string;
    value: string;
    label: string;
}

interface IOptionFilterPanelProps {
    label: string;
    options: IFilterOption[];
    value: string;
    onSelect: (value: string) => void;
}

export const OptionFilterPanel: FC<IOptionFilterPanelProps> = ({
    label,
    options,
    value,
    onSelect,
}) => (
    <OptionList role="group" aria-label={label}>
        {options.map((option) => (
            <PresetButton
                key={option.id}
                type="button"
                size="small"
                variant={value === option.value ? "primary" : "secondary"}
                aria-pressed={value === option.value}
                onClick={() => onSelect(option.value)}
            >
                {option.label}
            </PresetButton>
        ))}
    </OptionList>
);
