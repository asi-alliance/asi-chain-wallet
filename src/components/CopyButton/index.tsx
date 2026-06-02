import {
    type ReactElement,
    useState,
    useRef,
    useEffect,
    FC,
    CSSProperties,
    MouseEvent,
} from "react";
import "./style.css";

export interface ICopyButtonProps {
    action?: () => Promise<void>;
    dataToCopy?: string;
    size?: number;
    CustomCopyIcon?: FC<IIconProps>;
    buttonStyle?: CSSProperties;
    disabled?: boolean;
}

export interface IIconProps {
    size?: number;
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
            <g clip-path="url(#clip0_97_200)">
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

const CopyButton = ({
    action,
    dataToCopy,
    size,
    CustomCopyIcon,
    buttonStyle,
    disabled = false,
}: ICopyButtonProps) => {
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const runAction = async (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();

        try {
            if (isCopied) {
                return;
            }

            if (action) {
                await action();
            } else {
                await navigator.clipboard.writeText(dataToCopy ?? "");
            }

            setIsCopied(true);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => setIsCopied(false), 3000);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const CurrentCopyIcon = CustomCopyIcon ?? CopyIcon;

    return (
        <span className="copy-container">
            <button
                onClick={runAction}
                className="copy-button"
                title={isCopied ? "Copied" : "Copy"}
                style={{
                    transform: "translateX(115%)",
                    ...buttonStyle,
                }}
                disabled={disabled}
            >
                {isCopied ? (
                    <CopiedIcon size={size} />
                ) : (
                    <CurrentCopyIcon size={size} />
                )}
            </button>
        </span>
    );
};

export default CopyButton;
