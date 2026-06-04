import { ExpandIcon } from "components/Icons";
import { FC, useState, useRef, useEffect, CSSProperties } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";

const SelectWrapper = styled.div<{ disabled?: boolean }>`
    position: relative;
    min-width: 150px;

    ${({ disabled, theme }) =>
        disabled &&
        `
        opacity: 0.4;
        cursor: not-allowed;
        background: ${theme.inputBg};
    `}
`;

const SelectButton = styled.div<{
    $disabled?: boolean;
    $hasAdditionalLabel?: boolean;
}>`
    padding: 10px 20px;
    height: 44px;
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 6px;
    background: ${({ theme }) => theme.surface};
    color: ${({ theme }) => theme.text.primary};
    font-size: 16px;
    min-width: 150px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;

    ${({ $disabled, theme }) =>
        $disabled &&
        `
         opacity: 0.4;
        cursor: not-allowed;
        background: ${theme.inputBg};

    `}

    &:hover:not(:disabled) {
        background: ${({ theme }) => `${theme.text.primary}08`};
    }

    @media (max-width: 768px) {
        height: ${({ $hasAdditionalLabel }) =>
            $hasAdditionalLabel ? "auto" : "44px"};
    }
`;

const ArrowIconWrapper = styled.div<{ $isOpen: boolean }>`
    display: flex;
    align-items: center;
    transition: transform 0.2s ease;
    transform: ${({ $isOpen }) =>
        $isOpen ? "rotate(180deg)" : "rotate(0deg)"};
`;

const DropdownMenuPortal = styled.ul<{
    $position: { top: number; left: number; width: number };
}>`
    position: fixed;
    top: ${({ $position }) => $position.top}px;
    left: ${({ $position }) => $position.left}px;
    width: ${({ $position }) => $position.width}px;
    max-height: 200px;
    overflow-y: auto;
    margin: 0;
    padding: 0;
    list-style: none;
    background: ${({ theme }) => theme.surface};
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 6px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    z-index: 9999;
`;

const AdditionalLabel = styled.span`
    @media (max-width: 768px) {
        display: block;
    }
`;

const DropdownItem = styled.li<{
    $selected?: boolean;
    $withAdditionalLabel: boolean;
}>`
    padding: 10px 16px;
    cursor: pointer;
    font-size: 16px;
    display: ${({ $withAdditionalLabel }) =>
        $withAdditionalLabel ? "flex" : "block"};
    gap: ${({ $withAdditionalLabel }) =>
        $withAdditionalLabel ? "13px" : "none"};
    align-items: ${({ $withAdditionalLabel }) =>
        $withAdditionalLabel ? "center" : "initial"};
    color: ${({ theme, $selected }) =>
        $selected ? theme.primary : theme.text.primary};
    background: ${({ theme, $selected }) =>
        $selected ? `${theme.primary}10` : "transparent"};

    &:hover {
        background: ${({ theme }) => `${theme.text.primary}08`};
    }

    @media (max-width: 768px) {
        display: block;
    }
`;

const SelectedValue = styled.span`
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: flex;
    gap: 13px;
    align-items: center;

    @media (max-width: 768px) {
        display: block;
    }
`;

export interface ISelectOption {
    id: string | number;
    value: string;
    label: string;
    additionalLabel?: string;
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
}

const DROPDOWN_ITEM_DATA_ID: string = "dropdown-item";

export const Select: FC<ISelectProps> = ({
    value,
    onChange,
    disabled = false,
    placeholder = "Select option",
    options,
    id,
    className = "",
    style,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({
        top: 0,
        left: 0,
        width: 0,
    });

    const getSelectedText = () => {
        const selectedOption = options.find(
            (option: ISelectOption) => option.value === value,
        );

        return selectedOption?.label || placeholder;
    };

    const getSelectedAdditionalLabel = () => {
        const selectedOption = options.find(
            (option: ISelectOption) => option.value === value,
        );
        return selectedOption?.additionalLabel;
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            if (
                !wrapperRef.current ||
                wrapperRef.current.contains(target) ||
                target.closest(`[data-id="${DROPDOWN_ITEM_DATA_ID}"]`)
            ) {
                return;
            }

            setTimeout(() => {
                setIsOpen(false);
            }, 0);
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && wrapperRef.current) {
            updateDropdownPosition();

            window.addEventListener("scroll", updateDropdownPosition, true);
            window.addEventListener("resize", updateDropdownPosition);

            return () => {
                window.removeEventListener(
                    "scroll",
                    updateDropdownPosition,
                    true,
                );
                window.removeEventListener("resize", updateDropdownPosition);
            };
        }
    }, [isOpen]);

    const updateDropdownPosition = () => {
        if (wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
            });
        }
    };

    const handleSelect = (selectedValue: string) => {
        onChange(selectedValue);
        setIsOpen(false);
    };

    const toggleDropdown = () => {
        if (!isOpen) {
            updateDropdownPosition();
        }

        setIsOpen((previousValue) => !previousValue);
    };

    return (
        <SelectWrapper
            className={`select-wrapper ${className}`}
            ref={wrapperRef}
            disabled={disabled}
            style={style}
        >
            <SelectButton
                $hasAdditionalLabel={!!getSelectedAdditionalLabel()}
                onClick={toggleDropdown}
                $disabled={disabled}
            >
                <SelectedValue>
                    <span>{getSelectedText()}</span>
                    {getSelectedAdditionalLabel() && (
                        <AdditionalLabel className="text-4 text-light">
                            {getSelectedAdditionalLabel()}
                        </AdditionalLabel>
                    )}
                </SelectedValue>
                <ArrowIconWrapper $isOpen={isOpen}>
                    <ExpandIcon size={16} />
                </ArrowIconWrapper>
            </SelectButton>

            {isOpen &&
                !disabled &&
                createPortal(
                    <DropdownMenuPortal $position={dropdownPosition}>
                        {options.map((option) => {
                            const isSelected = value === option.value;
                            return (
                                <DropdownItem
                                    data-id={DROPDOWN_ITEM_DATA_ID}
                                    key={option.id}
                                    $selected={isSelected}
                                    onClick={() => handleSelect(option.value)}
                                    $withAdditionalLabel={
                                        !!option.additionalLabel
                                    }
                                >
                                    <span className="text-ellipsis">
                                        {option.label}
                                    </span>
                                    {option.additionalLabel && (
                                        <AdditionalLabel className="text-4 text-light text-ellipsis">
                                            {option.additionalLabel}
                                        </AdditionalLabel>
                                    )}
                                </DropdownItem>
                            );
                        })}
                    </DropdownMenuPortal>,
                    document.body,
                )}
        </SelectWrapper>
    );
};

export const AdaptiveSelect: FC<ISelectProps> = (props) => {
    return (
        <AdaptiveSelectWrapper className="adaptive-select-wrapper">
            <Select {...props} />
        </AdaptiveSelectWrapper>
    );
};

const AdaptiveSelectWrapper = styled.div`
    @media (max-width: 768px) {
        width: 100%;

        .select-wrapper {
            width: 100%;
            min-width: auto;
        }

        .select-wrapper > div:first-child {
            font-size: 12px !important;
        }

        .select-wrapper > div:first-child > span:first-child {
            font-size: 12px !important;
        }

        .select-wrapper > div:first-child > div svg {
            width: 14px !important;
            height: 14px !important;
        }

        .select-wrapper li {
            font-size: 12px !important;
        }
    }
`;
