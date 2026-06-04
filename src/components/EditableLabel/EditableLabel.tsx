import React, {
    useState,
    useRef,
    useEffect,
    CSSProperties,
    MouseEvent,
} from "react";
import styled from "styled-components";
import { EditIcon } from "components/Icons";
import { Input } from "components/Input";
import { InputProps } from "components/Input/Input";

export interface EditableLabelProps extends Omit<
    InputProps,
    "onChange" | "ref" | "labelStyle" | "onClick" | "onCancel"
> {
    label: string;
    onSave: (newLabel: string) => void;
    disabled?: boolean;
    placeholder?: string;
    inputSize?: "small" | "medium" | "large";
    labelClassName?: string;
    labelStyle?: CSSProperties;
    inputClassName?: string;
    "data-testid"?: string;
    isSelected?: boolean;
    isValid?: boolean;
    errorMessage?: string;
    onChange?: (newLabel: string) => void;
    onCancel?: () => void;
}

const EditableContainer = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    text-wrap: nowrap;
    text-overflow: ellipsis;
    gap: 8px;
`;

const LabelDisplay = styled.span<{ $isSelected: boolean; $disabled?: boolean }>`
    cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
    font-size: 20px !important;
    font-weight: 400;
    color: ${({ $isSelected, theme }) =>
        !$isSelected
            ? theme.text.primary
            : theme.colors.background.secondary} !important;
    margin: 0 !important;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const EditButton = styled.button<{ $isSelected: boolean }>`
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.2s ease;

    color: ${({ $isSelected, theme }) =>
        !$isSelected
            ? theme.text.primary
            : theme.colors.background.secondary} !important;

    &:hover:not(:disabled) {
        transform: translateY(-1px);
        opacity: 1;
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.3;
    }
`;

const InlineEditableInputContainer = styled.div`
    position: relative;
`;

const ErrorMessage = styled.span`
    position: absolute;
    display: block;
    font-size: 13px;
    line-height: 20px;
    font-weight: 500;
    color: ${({ theme }) => theme.danger};
    margin-top: 6px;
    animation: slideIn 0.2s ease;

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-2px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

const InlineEditableInput = styled(Input)<{ $isSelected: boolean }>`
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
        border-color: ${({ $isSelected, theme }) =>
            !$isSelected
                ? theme.text.primary
                : theme.colors.background.secondary};
        background: transparent;
        min-height: auto;
        font-weight: inherit;
        font-family: inherit;
        color: inherit;
        border-radius: 0;
        outline: none;
        box-shadow: none;
        width: auto;
        min-width: 100px;
        margin-bottom: 0;

        &:hover {
            border-color: ${({ $isSelected, theme }) =>
                !$isSelected
                    ? theme.text.primary
                    : theme.colors.background.secondary};
        }
        &:focus {
            border-color: ${({ $isSelected, theme }) =>
                !$isSelected
                    ? theme.text.primary
                    : theme.colors.background.secondary};
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
    onSave,
    disabled = false,
    placeholder = "Enter value",
    "data-testid": dataTestId,
    labelClassName,
    inputClassName,
    isSelected = true,
    labelStyle,
    errorMessage,
    isValid = true,
    onChange,
    onCancel,
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
        if (!value.trim() || value === label) {
            setIsEditing(false);

            return;
        }

        onSave(value.trim());
        setIsEditing(false);
    };

    const handleCancel = () => {
        setValue(label);
        setIsEditing(false);

        if (!onCancel) {
            return;
        }

        onCancel();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Escape") {
            handleCancel();
        }

        if (!isValid) {
            return;
        }

        if (event.key !== "Enter") {
            return;
        }

        handleSave();
    };

    const handleClick = (event: MouseEvent<HTMLInputElement>): void => {
        event.stopPropagation();
    };

    const handleBlur = () => {
        handleCancel();
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);

        if (!onChange) {
            return;
        }

        onChange(event.target.value);
    };

    const { style, className: propsInputClassname, ...otherProps } = props;

    const fullStyle: CSSProperties = {
        ...props.style,
        background: "transparent",
        padding: "0",
        border: "none",
        outline: "none",
        minHeight: "auto",
    };

    const currentErrorMessage: string | undefined = !isValid
        ? errorMessage
        : undefined;

    if (isEditing && !disabled) {
        return (
            <InlineEditableInputContainer>
                <InlineEditableInput
                    inputRef={inputRef}
                    value={value}
                    onClick={handleClick}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    data-testid={dataTestId ? `${dataTestId}-input` : undefined}
                    autoFocus
                    $isSelected={isSelected}
                    style={fullStyle}
                    wrapperStyle={{ marginBottom: "0" }}
                    className={`inline-editable-input ${inputClassName} ${propsInputClassname}`}
                    withoutHoverUI
                    {...otherProps}
                />
                {!!currentErrorMessage && (
                    <ErrorMessage>{currentErrorMessage}</ErrorMessage>
                )}
            </InlineEditableInputContainer>
        );
    }

    return (
        <EditableContainer>
            <LabelDisplay
                $isSelected={isSelected}
                $disabled={disabled}
                className={`editable-label-text ${labelClassName || ""}`}
                onClick={handleEditClick}
                style={labelStyle}
                data-testid={dataTestId ? `${dataTestId}-label` : undefined}
            >
                {label || placeholder}
            </LabelDisplay>
            {!disabled && (
                <EditButton
                    $isSelected={isSelected}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick();
                    }}
                    disabled={disabled}
                    aria-label="Edit label"
                >
                    <EditIcon color="currentColor" size={14} />
                </EditButton>
            )}
        </EditableContainer>
    );
};
