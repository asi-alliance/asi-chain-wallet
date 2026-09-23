import { SearchIcon } from "components/Icons";
import { Input } from "components/Input";
import { InputProps, StyledInput } from "components/Input/Input";
import React, { useState } from "react";
import styled from "styled-components";

const IconWrapper = styled.span`
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.text.tertiary};
`;

const SearchRoot = styled.div<{
    $active: boolean;
    $status: InputProps["status"];
}>`
    width: 100%;

    ${({ $active, $status, theme }) =>
        $active &&
        `
            ${StyledInput} {
                --control-field-hover-border: ${$status === "success" ? theme.success : theme.primary};
                border-color: ${$status === "success" ? theme.success : theme.primary};
                box-shadow: 0 0 0 4px ${theme.focusRing};
            }
        `}
`;

export interface SearchProps
    extends Omit<InputProps, "onChange" | "startAdornment" | "endAdornment"> {
    value?: string;
    onChange?: (value: string) => void;
    onSearch?: (value: string) => void;
    placeholder?: string;
    fullWidth?: boolean;
    disabled?: boolean;
    label?: string;
    error?: string;
    action?: React.ReactNode;
    active?: boolean;
    "data-testid"?: string;
    "data-cy"?: string;
}

export const Search: React.FC<SearchProps> = ({
    value,
    onChange,
    onSearch,
    placeholder = "Search...",
    fullWidth = true,
    disabled = false,
    label,
    error,
    action,
    active = false,
    status = "default",
    onKeyDown,
    "data-testid": dataTestId,
    "data-cy": dataCy,
    ...props
}) => {
    const [searchValue, setSearchValue] = useState(value ?? "");
    const isControlled = value !== undefined;
    const displayedValue = isControlled ? value : searchValue;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;

        if (!isControlled) setSearchValue(newValue);

        if (!onChange) {
            return;
        }

        onChange(newValue);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event);

        if (event.key !== "Enter" || !onSearch) {
            return;
        }

        onSearch(displayedValue);
    };

    return (
        <SearchRoot
            $active={active && !error && !disabled}
            $status={status}
        >
          <Input
            label={label}
            error={error}
            status={status}
            fullWidth={fullWidth}
            disabled={disabled}
            placeholder={placeholder}
            value={displayedValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            aria-label={label ? undefined : placeholder}
            startAdornment={
                <IconWrapper aria-hidden="true">
                    <SearchIcon size={18} />
                </IconWrapper>
            }
            endAdornment={action}
            data-testid={dataTestId || "search-input"}
            data-cy={dataCy || "search-input"}
            {...props}
          />
        </SearchRoot>
    );
};
