import React, { useState, useRef, useEffect, CSSProperties } from "react";
import styled from "styled-components";
import { EditIcon } from "components/Icons";
import { Input } from "components/Input";
import { InputProps } from "components/Input/Input";

interface EditableLabelProps extends Omit<InputProps, "onChange" | "ref"> {
    label: string;
    onChange: (newLabel: string) => void;
    disabled?: boolean;
    placeholder?: string;
    inputSize?: "small" | "medium" | "large";
    labelClassName?: string;
    inputClassName?: string;
    "data-testid"?: string;
    isSelected?: boolean;
}

const EditableContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const LabelDisplay = styled.span<{ isSelected: boolean; disabled?: boolean }>`
    cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
    font-size: 20px !important;
    font-weight: 400;
    color: ${({ isSelected, theme }) =>
        !isSelected
            ? theme.text.primary
            : theme.colors.background.secondary} !important;
    margin: 0 !important;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const EditButton = styled.button<{ isSelected: boolean }>`
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.2s ease;

    color: ${({ isSelected, theme }) =>
        !isSelected
            ? theme.text.primary
            : theme.colors.background.secondary} !important;

    &:hover {
        opacity: 1;
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.3;
    }
`;

const InlineEditableInput = styled(Input)`
    & > div {
        margin-bottom: 0;
        width: auto;
        display: inline-block;
    }

    & > div > label {
        display: none;
    }

    & input {
        padding: 0;
        margin: 0;
        border: none;
        background: transparent;
        min-height: auto;
        font-size: inherit;
        font-weight: inherit;
        font-family: inherit;
        color: inherit;
        border-radius: 0;
        outline: none;
        box-shadow: none;
        width: auto;
        min-width: 100px;
        margin-bottom: 0;

        &:focus {
            outline: none;
            border: none;
            box-shadow: none;
        }

        &:hover {
            border: none;
        }

        &::placeholder {
            color: ${({ theme }) => theme.text.secondary};
            opacity: 0.6;
        }
    }

    & > div > span:last-child {
        display: none;
    }
`;

export const EditableLabel: React.FC<EditableLabelProps> = ({
    label,
    onChange,
    disabled = false,
    placeholder = "Enter value",
    "data-testid": dataTestId,
    labelClassName,
    inputClassName,
    isSelected = true,
    ...props
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(label);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleEditClick = () => {
        if (!disabled) {
            setValue(label);
            setIsEditing(true);
        }
    };

    const handleSave = () => {
        if (value.trim() && value !== label) {
            onChange(value.trim());
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setValue(label);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            handleCancel();
        }
    };

    const handleBlur = () => {
        handleSave();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
    };

    const { style, className: propsInputClassname, ...otherProps } = props;

    const fullStyle: CSSProperties = {
        ...props.style,
        background: "transparent",
        border: "none",
        padding: "0",
        outline: "none",
        minHeight: "auto",
    };

    if (isEditing && !disabled) {
        return (
            <InlineEditableInput
                inputRef={inputRef}
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder={placeholder}
                data-testid={dataTestId ? `${dataTestId}-input` : undefined}
                autoFocus
                style={fullStyle}
                wrapperStyle={{ marginBottom: "0" }}
                className={`${inputClassName} ${propsInputClassname}`}
                {...otherProps}
            />
        );
    }

    return (
        <EditableContainer>
            <LabelDisplay
                isSelected={isSelected}
                disabled={disabled}
                className={`editable-label-text ${labelClassName || ""}`}
                onClick={handleEditClick}
                data-testid={dataTestId ? `${dataTestId}-label` : undefined}
            >
                {label || placeholder}
            </LabelDisplay>
            {!disabled && (
                <EditButton
                    isSelected={isSelected}
                    onClick={handleEditClick}
                    disabled={disabled}
                    aria-label="Edit label"
                >
                    <EditIcon color="currentColor" size={14} />
                </EditButton>
            )}
        </EditableContainer>
    );
};
