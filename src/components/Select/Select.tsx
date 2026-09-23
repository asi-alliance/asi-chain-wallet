import { ExpandIcon } from "components/Icons";
import { ErrorMessage } from "components/Input/Input";
import {
    CSSProperties,
    FC,
    KeyboardEvent,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";

export type SelectVariant = "default" | "ghost";

const SelectWrapper = styled.div`
    position: relative;
    min-width: 150px;
`;

const HiddenFormSelect = styled.select`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
`;

const SelectButton = styled.button<{ $variant: SelectVariant }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-width: 150px;
    height: ${({ $variant, theme }) =>
        $variant === "ghost"
            ? theme.sizes.control.small
            : theme.sizes.control.field};
    padding: ${({ $variant }) =>
        $variant === "ghost" ? "8px 12px" : "12px"};
    gap: ${({ theme }) => theme.spacing.md};
    border: ${({ $variant, theme }) =>
        $variant === "ghost"
            ? "none"
            : `${theme.control.borderWidth} solid ${theme.control.fieldBorder}`};
    border-radius: ${({ theme }) => theme.radii.sm};
    background: ${({ $variant, theme }) =>
        $variant === "ghost" ? "transparent" : theme.control.fieldBackground};
    color: ${({ theme }) => theme.text.primary};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
    cursor: pointer;
    transition:
        border-color ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing},
        background-color ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing},
        box-shadow ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing};

    &:hover:not(:disabled) {
        ${({ $variant, theme }) =>
            $variant === "ghost"
                ? ""
                : `border-color: ${theme.control.fieldHoverBorder};`}
    }

    &[aria-expanded="true"]:not(:disabled) {
        ${({ $variant, theme }) =>
            $variant === "ghost" ? "" : `border-color: ${theme.primary};`}
    }

    &:focus-visible {
        outline: none;
        ${({ $variant, theme }) =>
            $variant === "ghost" ? "" : `border-color: ${theme.primary};`}
        box-shadow: 0 0 0 4px ${({ theme }) => theme.focusRing};
    }

    &[aria-invalid="true"]:not(:disabled) {
        ${({ $variant, theme }) =>
            $variant === "ghost" ? "" : `border-color: ${theme.danger};`}

        &:focus-visible {
            box-shadow: 0 0 0 4px ${({ theme }) => theme.dangerFocusRing};
        }
    }

    &:disabled {
        cursor: not-allowed;
        ${({ $variant, theme }) =>
            $variant === "ghost"
                ? ""
                : `
                border-color: ${theme.control.disabledBorder};
                background: ${theme.control.disabledBackground};
            `}
        opacity: 0.55;
    }
`;

const ArrowIconWrapper = styled.span<{ $isOpen: boolean }>`
    display: flex;
    align-items: center;
    flex-shrink: 0;
    transform: ${({ $isOpen }) =>
        $isOpen ? "rotate(180deg)" : "rotate(0deg)"};
    transition: transform ${({ theme }) => theme.motion.normal}
        ${({ theme }) => theme.motion.easing};
`;

const DropdownMenuPortal = styled.ul<{
    $position: { top: number; left: number; width: number };
}>`
    position: fixed;
    top: ${({ $position }) => $position.top}px;
    left: ${({ $position }) => $position.left}px;
    z-index: ${({ theme }) => theme.zIndices.dropdown};
    width: ${({ $position }) => $position.width}px;
    max-height: 240px;
    margin: 0;
    padding: ${({ theme }) => theme.spacing.xs};
    overflow-y: auto;
    list-style: none;
    border: ${({ theme }) => theme.control.borderWidth} solid
        ${({ theme }) => theme.control.fieldBorder};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.surface};
    box-shadow: ${({ theme }) => theme.shadowLarge};
`;

const AdditionalLabel = styled.span`
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.size.xs};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        display: block;
    }
`;

const DropdownItem = styled.li<{
    $selected: boolean;
    $focused: boolean;
    $withAdditionalLabel: boolean;
    $disabled: boolean;
}>`
    display: ${({ $withAdditionalLabel }) =>
        $withAdditionalLabel ? "flex" : "block"};
    align-items: center;
    min-height: ${({ theme }) => theme.sizes.control.medium};
    padding: ${({ theme }) =>
        `${theme.spacing.sm} ${theme.spacing.xl}`};
    gap: ${({ theme }) => theme.spacing.lg};
    border-radius: ${({ theme }) => theme.radii.sm};
    background: ${({ theme, $selected, $focused }) =>
        $selected && $focused
            ? theme.primaryMuted
            : $selected
              ? theme.primarySubtle
              : $focused
                ? theme.hoverSurface
                : "transparent"};
    color: ${({ theme, $selected }) =>
        $selected ? theme.actionText : theme.text.primary};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme, $selected }) =>
        $selected
            ? theme.typography.weight.medium
            : theme.typography.weight.regular};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
    cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
    opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        display: block;
    }
`;

const SelectedValue = styled.span`
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    gap: ${({ theme }) => theme.spacing.lg};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        display: block;
    }
`;

export interface ISelectOption {
    id: string | number;
    value: string;
    label: string;
    additionalLabel?: string;
    disabled?: boolean;
}

export interface ISelectProps {
    value?: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    options: ISelectOption[];
    id?: string;
    className?: string;
    style?: CSSProperties;
    variant?: SelectVariant;
    "aria-label"?: string;
    "aria-labelledby"?: string;
    name?: string;
    required?: boolean;
    form?: string;
}

const nextEnabledIndex = (
    options: ISelectOption[],
    currentIndex: number,
    direction: 1 | -1,
): number => {
    if (!options.length) return -1;

    for (let offset = 1; offset <= options.length; offset += 1) {
        const index =
            ((currentIndex + direction * offset) % options.length + options.length) %
            options.length;
        if (!options[index].disabled) return index;
    }
    return -1;
};

export const Select: FC<ISelectProps> = ({
    value,
    onChange,
    disabled = false,
    placeholder = "Select option",
    options,
    id,
    className = "",
    style,
    variant = "default",
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    name,
    required,
    form,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [validationError, setValidationError] = useState("");
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const formSelectRef = useRef<HTMLSelectElement>(null);
    const menuRef = useRef<HTMLUListElement>(null);
    const previousOptionsRef = useRef(options);
    const generatedId = useId().replace(/:/g, "");
    const controlId = id ? `${id}-button` : `select-${generatedId}`;
    const menuId = `${controlId}-menu`;
    const errorId = `${controlId}-error`;
    const [dropdownPosition, setDropdownPosition] = useState({
        top: 0,
        left: 0,
        width: 0,
    });
    const selectedIndex = options.findIndex((option) => option.value === value);
    const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;

    useLayoutEffect(() => {
        // Native reset must preserve the controlled value, like the visible trigger.
        const select = formSelectRef.current;
        if (!select) return;
        const resetIndex = select.selectedIndex;
        Array.from(select.options).forEach((option, index) => {
            option.defaultSelected = index === resetIndex;
        });
    }, [value, options, name, required]);

    useEffect(() => {
        if (!required || disabled || (selectedOption && value !== "")) {
            setValidationError("");
        }
    }, [required, disabled, selectedOption, value]);

    const updateDropdownPosition = (): void => {
        const rect = wrapperRef.current?.getBoundingClientRect();
        if (!rect) return;
        setDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
        });
    };

    const openDropdown = (): void => {
        if (disabled) return;
        updateDropdownPosition();
        setFocusedIndex(
            selectedIndex >= 0 && !options[selectedIndex]?.disabled
                ? selectedIndex
                : nextEnabledIndex(options, -1, 1),
        );
        setIsOpen(true);
    };

    const closeDropdown = (): void => setIsOpen(false);

    const handleSelect = (option: ISelectOption | undefined): void => {
        if (!option || option.disabled) return;
        onChange(option.value);
        closeDropdown();
        buttonRef.current?.focus();
    };

    useLayoutEffect(() => {
        const previousOptions = previousOptionsRef.current;
        previousOptionsRef.current = options;
        if (!isOpen || previousOptions === options) return;
        const activeId = previousOptions[focusedIndex]?.id;
        const nextIndex = options.findIndex(
            (option) => option.id === activeId && !option.disabled,
        );
        setFocusedIndex(nextIndex >= 0 ? nextIndex : nextEnabledIndex(options, -1, 1));
    }, [options, isOpen, focusedIndex]);

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
        if (disabled) return;

        if (event.key === "Escape" && isOpen) {
            event.preventDefault();
            event.stopPropagation();
            closeDropdown();
            return;
        }

        if (event.key === "Tab") {
            closeDropdown();
            return;
        }

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!isOpen) {
                openDropdown();
                return;
            }
            setFocusedIndex((current) =>
                nextEnabledIndex(
                    options,
                    current,
                    event.key === "ArrowDown" ? 1 : -1,
                ),
            );
            return;
        }

        if (isOpen && (event.key === "Home" || event.key === "End")) {
            event.preventDefault();
            setFocusedIndex(
                nextEnabledIndex(
                    options,
                    event.key === "Home" ? -1 : 0,
                    event.key === "Home" ? 1 : -1,
                ),
            );
            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!isOpen) {
                openDropdown();
            } else if (focusedIndex >= 0) {
                handleSelect(options[focusedIndex]);
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            const target = event.target as Node;
            if (
                wrapperRef.current?.contains(target) ||
                menuRef.current?.contains(target)
            ) {
                return;
            }
            closeDropdown();
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen || focusedIndex < 0) return;
        menuRef.current?.children[focusedIndex]?.scrollIntoView?.({
            block: "nearest",
        });
    }, [isOpen, focusedIndex]);

    useEffect(() => {
        if (!isOpen) return;

        window.addEventListener("scroll", updateDropdownPosition, true);
        window.addEventListener("resize", updateDropdownPosition);
        return () => {
            window.removeEventListener("scroll", updateDropdownPosition, true);
            window.removeEventListener("resize", updateDropdownPosition);
        };
    }, [isOpen]);

    return (
        <SelectWrapper
            id={id}
            className={`select-wrapper ${className}`}
            ref={wrapperRef}
            style={style}
        >
            {(name || required) && (
                <HiddenFormSelect
                    ref={formSelectRef}
                    name={name}
                    value={value ?? ""}
                    required={required}
                    disabled={disabled}
                    form={form}
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={(event) => onChange(event.target.value)}
                    onInvalid={(event) => {
                        event.preventDefault();
                        setValidationError(event.currentTarget.validationMessage);
                        window.setTimeout(() => buttonRef.current?.focus(), 0);
                    }}
                >
                    <option value="" />
                    {options.map((option) => (
                        <option
                            key={option.id}
                            value={option.value}
                            disabled={option.disabled}
                        >
                            {option.label}
                        </option>
                    ))}
                </HiddenFormSelect>
            )}
            <SelectButton
                id={controlId}
                ref={buttonRef}
                type="button"
                disabled={disabled}
                $variant={variant}
                role="combobox"
                aria-label={
                    ariaLabelledBy ? undefined : (ariaLabel ?? placeholder)
                }
                aria-labelledby={ariaLabelledBy}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-required={required || undefined}
                aria-invalid={validationError ? true : undefined}
                aria-describedby={validationError ? errorId : undefined}
                aria-controls={menuId}
                aria-activedescendant={
                    isOpen && focusedIndex >= 0
                        ? `${menuId}-option-${focusedIndex}`
                        : undefined
                }
                onClick={() => (isOpen ? closeDropdown() : openDropdown())}
                onKeyDown={handleKeyDown}
            >
                <SelectedValue>
                    <span>{selectedOption?.label ?? placeholder}</span>
                    {selectedOption?.additionalLabel && (
                        <AdditionalLabel>
                            {selectedOption.additionalLabel}
                        </AdditionalLabel>
                    )}
                </SelectedValue>
                <ArrowIconWrapper $isOpen={isOpen} aria-hidden="true">
                    <ExpandIcon size={16} />
                </ArrowIconWrapper>
            </SelectButton>
            {validationError && <ErrorMessage id={errorId} role="alert">{validationError}</ErrorMessage>}

            {isOpen &&
                createPortal(
                    <DropdownMenuPortal
                        id={menuId}
                        ref={menuRef}
                        role="listbox"
                        aria-labelledby={controlId}
                        $position={dropdownPosition}
                    >
                        {options.map((option, index) => (
                            <DropdownItem
                                id={`${menuId}-option-${index}`}
                                key={option.id}
                                role="option"
                                aria-selected={value === option.value}
                                aria-disabled={option.disabled || undefined}
                                $selected={value === option.value}
                                $focused={focusedIndex === index}
                                $withAdditionalLabel={!!option.additionalLabel}
                                $disabled={!!option.disabled}
                                onMouseEnter={() =>
                                    !option.disabled && setFocusedIndex(index)
                                }
                                onClick={() => handleSelect(option)}
                            >
                                <span className="text-ellipsis">
                                    {option.label}
                                </span>
                                {option.additionalLabel && (
                                    <AdditionalLabel className="text-ellipsis">
                                        {option.additionalLabel}
                                    </AdditionalLabel>
                                )}
                            </DropdownItem>
                        ))}
                    </DropdownMenuPortal>,
                    buttonRef.current?.closest("[data-modal-overlay]") ?? document.body,
                )}
        </SelectWrapper>
    );
};

export const AdaptiveSelect: FC<ISelectProps> = (props) => (
    <AdaptiveSelectWrapper className="adaptive-select-wrapper">
        <Select {...props} />
    </AdaptiveSelectWrapper>
);

const AdaptiveSelectWrapper = styled.div`
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        width: 100%;

        .select-wrapper {
            width: 100%;
            min-width: 0;
        }
    }
`;
