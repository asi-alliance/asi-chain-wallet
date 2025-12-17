import { useState, useEffect, useRef, useCallback } from "react";
import "./style.css";

export interface OptionType {
    value: string;
    title: string;
}

interface DropdownListProps {
    options: OptionType[];
    onSelect: (option: OptionType) => void;
}

const DropdownList = ({ options, onSelect }: DropdownListProps) => {
    const [isOptionsShown, setIsOptionsShown] = useState(false);
    const [selectedItem, setSelectedItem] = useState<OptionType>(
        options[0] ?? { value: "", title: "" }
    );

    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectItem = useCallback(
        (option: OptionType) => {
            setSelectedItem(option);
            onSelect(option);
            setIsOptionsShown(false);
        },
        [onSelect]
    );

    const toggleVisibility = () => {
        setIsOptionsShown((prevent) => !prevent);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOptionsShown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div
            ref={dropdownRef}
            className="dropdown-holder"
            onClick={toggleVisibility}
        >
            <div className="dropdown-title">
                <div>{selectedItem.title}</div>
                <div
                    className={`arrow-svg-container ${
                        isOptionsShown ? "arrow-turn" : ""
                    }`}
                >
                    <svg
                        width="10px"
                        height="6px"
                        viewBox="0 0 10 6"
                        fill="none"
                    >
                        <path
                            d="M1 1L5 5L9 1"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            stroke="currentColor"
                        />
                    </svg>
                </div>
            </div>
            {isOptionsShown && (
                <div className="options-holder fade">
                    {options.map((option, index) => (
                        <div
                            key={index}
                            className="option"
                            onClick={(event) => {
                                event.stopPropagation();
                                selectItem(option);
                            }}
                        >
                            {option.title}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DropdownList;