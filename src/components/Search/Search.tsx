import { SearchIcon } from "components/Icons";
import { Input } from "components/Input";
import { InputProps } from "components/Input/Input";
import React, { useState } from "react";
import styled from "styled-components";

const SearchWrapper = styled.div`
    position: relative;
    width: 100%;
`;

const IconWrapper = styled.div`
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
`;

interface SearchProps extends Omit<InputProps, "onChange"> {
    value?: string;
    onChange?: (value: string) => void;
    onSearch?: (value: string) => void;
    placeholder?: string;
    fullWidth?: boolean;
    disabled?: boolean;
    label?: string;
    error?: string;
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
    "data-testid": dataTestId,
    "data-cy": dataCy,
    ...props
}) => {
    const [searchValue, setSearchValue] = useState(value || "");

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;

        setSearchValue(newValue);

        if (!onChange) {
            return;
        }

        onChange(newValue);
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== "Enter" || !onSearch) {
            return;
        }

        onSearch(searchValue);
    };

    return (
        <SearchWrapper>
            <Input
                label={label}
                error={error}
                fullWidth={fullWidth}
                disabled={disabled}
                placeholder={placeholder}
                value={searchValue}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                data-testid={dataTestId || "search-input"}
                data-cy={dataCy || "search-input"}
                {...props}
            />
            <IconWrapper>
                <SearchIcon size={18} color="#9CA3AF" />
            </IconWrapper>
        </SearchWrapper>
    );
};
