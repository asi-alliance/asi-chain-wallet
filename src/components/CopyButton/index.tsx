import styled from "styled-components";
import { type ReactElement, FC, CSSProperties, MouseEvent } from "react";
import { useCopyToClipboard } from "hooks";
import "./style.css";

export interface ICopyButtonProps {
    title?: string;
    dataToCopy?: string;
    size?: number;
    CustomCopyIcon?: FC<IIconProps>;
    buttonStyle?: CSSProperties;
    disabled?: boolean;
}

export interface IIconProps {
    size?: number;
    color?: string;
}

const CopyIcon = ({ size = 24 }: IIconProps): ReactElement => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <g clipPath="url(#clip0_97_200)">
                <path
                    d="M10.6667 0.666668H2.66668C1.93334 0.666668 1.33334 1.26667 1.33334 2V11.3333H2.66668V2H10.6667V0.666668ZM12.6667 3.33333H5.33334C4.60001 3.33333 4.00001 3.93333 4.00001 4.66667V14C4.00001 14.7333 4.60001 15.3333 5.33334 15.3333H12.6667C13.4 15.3333 14 14.7333 14 14V4.66667C14 3.93333 13.4 3.33333 12.6667 3.33333ZM12.6667 14H5.33334V4.66667H12.6667V14Z"
                    fill="currentColor"
                />
            </g>
            <defs>
                <clipPath id="clip0_97_200">
                    <rect width="16" height="16" fill="currentColor" />
                </clipPath>
            </defs>
        </svg>
    );
};

const CopiedIcon = ({ size = 24 }: IIconProps): ReactElement => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-check-icon lucide-check"
        >
            <path d="M20 6 9 17l-5-5" />
        </svg>
    );
};

const ThemeButton = styled.button`
    color: ${({ theme }) => theme.text.primary};

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.focusRing};
        outline-offset: 4px;
        border-radius: ${({ theme }) => theme.radii.xs};
    }
`;

const COPIED_ICON_DURATION_MS: number = 3000;

const CopyButton = ({
    dataToCopy = "",
    size,
    CustomCopyIcon,
    buttonStyle,
    title,
    disabled = false,
}: ICopyButtonProps) => {
    const clipboard = useCopyToClipboard(COPIED_ICON_DURATION_MS);
    const isCopied =
        clipboard.result?.status === "copied" &&
        clipboard.result.value === dataToCopy;

    const handleClick = (event: MouseEvent<HTMLButtonElement>): void => {
        event.stopPropagation();

        if (isCopied) {
            return;
        }

        clipboard.copy(dataToCopy);
    };

    const CurrentCopyIcon = CustomCopyIcon ?? CopyIcon;

    return (
        <span className="copy-container">
            <ThemeButton
                onClick={handleClick}
                className="copy-button"
                title={isCopied ? "Copied" : title || "Copy"}
                aria-label={isCopied ? "Copied" : title || "Copy"}
                style={buttonStyle}
                disabled={disabled}
            >
                {isCopied ? (
                    <CopiedIcon size={size} />
                ) : (
                    <CurrentCopyIcon color="currentColor" size={size} />
                )}
            </ThemeButton>
        </span>
    );
};

export default CopyButton;
