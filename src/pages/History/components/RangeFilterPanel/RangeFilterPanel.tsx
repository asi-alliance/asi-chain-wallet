import { FC, ReactNode } from "react";
import { useTheme } from "styled-components";
import { Input } from "components";
import { IRangeFilter } from "utils/historyFilters";
import {
    FilterPanelTitle,
    PresetButton,
    PresetGrid,
} from "../filterPanelStyles";

interface IRangePreset {
    id: string;
    label: string;
}

interface IRangeField {
    id: string;
    label: string;
    error?: string;
}

interface IRangeFilterPanelProps {
    presetsTitle: string;
    presetsTitleId: string;
    presets: IRangePreset[];
    customTitle: string;
    inputType: "date" | "number";
    fromField: IRangeField;
    toField: IRangeField;
    value: IRangeFilter;
    onChange: (patch: Partial<IRangeFilter>) => void;
    actions: ReactNode;
}

export const RangeFilterPanel: FC<IRangeFilterPanelProps> = ({
    presetsTitle,
    presetsTitleId,
    presets,
    customTitle,
    inputType,
    fromField,
    toField,
    value,
    onChange,
    actions,
}) => {
    const theme = useTheme();
    const numberInputProps =
        inputType === "number" ? { min: "0", step: "any" } : {};

    return (
        <>
            <FilterPanelTitle id={presetsTitleId}>{presetsTitle}</FilterPanelTitle>
            <PresetGrid role="group" aria-labelledby={presetsTitleId}>
                {presets.map((preset) => (
                    <PresetButton
                        key={preset.id}
                        type="button"
                        size="small"
                        variant={
                            value.preset === preset.id ? "primary" : "secondary"
                        }
                        aria-pressed={value.preset === preset.id}
                        onClick={() =>
                            onChange({
                                preset:
                                    value.preset === preset.id ? "" : preset.id,
                                from: "",
                                to: "",
                            })
                        }
                    >
                        {preset.label}
                    </PresetButton>
                ))}
            </PresetGrid>
            <FilterPanelTitle>{customTitle}</FilterPanelTitle>
            <Input
                id={fromField.id}
                type={inputType}
                {...numberInputProps}
                label={fromField.label}
                value={value.from}
                onChange={(event) =>
                    onChange({ from: event.target.value, preset: "" })
                }
                error={fromField.error}
                wrapperStyle={{ marginBottom: theme.spacing.lg }}
            />
            <Input
                id={toField.id}
                type={inputType}
                {...numberInputProps}
                label={toField.label}
                value={value.to}
                onChange={(event) =>
                    onChange({ to: event.target.value, preset: "" })
                }
                error={toField.error}
                wrapperStyle={{ marginBottom: theme.spacing.xl }}
            />
            {actions}
        </>
    );
};
