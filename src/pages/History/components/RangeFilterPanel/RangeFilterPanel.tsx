import { FC, ReactNode } from "react";
import styled from "styled-components";
import { Input } from "components";
import { IRangeFilter } from "utils/historyFilters";
import {
    FilterPanelTitle,
    PresetButton,
    PresetGrid,
} from "../filterPanelStyles";

const CustomRangeFields = styled.div`
    display: grid;
    gap: ${({ theme }) => theme.spacing.lg};
    margin-bottom: ${({ theme }) => theme.spacing.xl};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: ${({ theme }) => theme.spacing.md};
    }
`;

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
            <CustomRangeFields>
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
                    wrapperStyle={{ marginBottom: 0 }}
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
                    wrapperStyle={{ marginBottom: 0 }}
                />
            </CustomRangeFields>
            {actions}
        </>
    );
};
