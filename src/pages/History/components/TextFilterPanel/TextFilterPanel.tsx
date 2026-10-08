import { FC, ReactNode } from "react";
import { useTheme } from "styled-components";
import { Input } from "components";

interface ITextFilterPanelProps {
    id: string;
    label: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    actions: ReactNode;
}

export const TextFilterPanel: FC<ITextFilterPanelProps> = ({
    id,
    label,
    placeholder,
    value,
    onChange,
    actions,
}) => {
    const theme = useTheme();

    return (
        <>
            <Input
                id={id}
                label={label}
                placeholder={placeholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                wrapperStyle={{ marginBottom: theme.spacing.xl }}
            />
            {actions}
        </>
    );
};
