import { ExpandIcon } from "components/Icons";
import { FC, useState, useRef, useEffect } from "react";
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

const SelectButton = styled.div<{ disabled?: boolean }>`
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

    ${({ disabled, theme }) =>
        disabled &&
        `
         opacity: 0.4;
        cursor: not-allowed;
        background: ${theme.inputBg};

    `}

    &:hover:not(:disabled) {
        background: ${({ theme }) => `${theme.text.primary}08`};
    }
`;

const SelectedValue = styled.span`
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const ArrowIconWrapper = styled.div<{ isOpen: boolean }>`
    display: flex;
    align-items: center;
    transition: transform 0.2s ease;
    transform: ${({ isOpen }) => (isOpen ? "rotate(180deg)" : "rotate(0deg)")};
`;

const DropdownMenu = styled.ul`
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    max-height: 200px;
    overflow-y: auto;
    margin: 0;
    padding: 0;
    list-style: none;
    background: ${({ theme }) => theme.surface};
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 6px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    z-index: 1000;
`;

const DropdownItem = styled.li<{ selected?: boolean }>`
    padding: 10px 16px;
    cursor: pointer;
    font-size: 16px;
    color: ${({ theme, selected }) =>
        selected ? theme.primary : theme.text.primary};
    background: ${({ theme, selected }) =>
        selected ? `${theme.primary}10` : "transparent"};

    &:hover {
        background: ${({ theme }) => `${theme.text.primary}08`};
    }
`;

export interface ISelectOption {
    id: string | number;
    value: string;
    label: string;
}

interface ISelectProps {
    value?: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    options: ISelectOption[];
    id?: string;
}

export const Select: FC<ISelectProps> = ({
    value,
    onChange,
    disabled = false,
    placeholder = "Select option",
    options,
    id,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const getSelectedText = () => {
        const selectedOption = options.find(
            (option: ISelectOption) => option.value === value,
        );

        return selectedOption?.label || placeholder;
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (selectedValue: string) => {
        onChange(selectedValue);
        setIsOpen(false);
    };

    return (
        <SelectWrapper
            className="select-wrapper"
            ref={wrapperRef}
            disabled={disabled}
        >
            <SelectButton
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
            >
                <SelectedValue>{getSelectedText()}</SelectedValue>
                <ArrowIconWrapper isOpen={isOpen}>
                    <ExpandIcon size={16} />
                </ArrowIconWrapper>
            </SelectButton>

            {isOpen && !disabled && (
                <DropdownMenu>
                    {options.map((option) => {
                        const isSelected = value === option.value;

                        return (
                            <DropdownItem
                                key={option.id}
                                selected={isSelected}
                                onClick={() => handleSelect(option.value)}
                            >
                                {option.label}
                            </DropdownItem>
                        );
                    })}
                </DropdownMenu>
            )}
        </SelectWrapper>
    );
};

// export const AdaptiveSelect = styled(Select)`
//     @media (max-width: 768px) {
//         min-width: 500px;

//         & > div:first-child {
//             font-size: 12px;
//         }

//         & > div:first-child > span:first-child {
//             font-size: 12px;
//         }

//         & > div:first-child > div svg {
//             width: 14px;
//             height: 14px;
//         }
//     }
// `;

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
