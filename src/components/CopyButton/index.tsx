import { type ReactElement, useState, useRef, useEffect } from "react";
import "./style.css";

export interface ICopyButtonProps {
    action?: () => Promise<void>;
    dataToCopy?: string;
    iconSize?: number;
}

export interface IIconProps {
    iconSize?: number;
}

const CopyIcon = ({ iconSize = 24 }: IIconProps): ReactElement => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-copy-icon lucide-copy"
        >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
    );
};

const CopiedIcon = ({ iconSize = 24 }: IIconProps): ReactElement => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
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

const CopyButton = ({ action, dataToCopy, iconSize }: ICopyButtonProps) => {
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const runAction = async () => {
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

    return (
        <span className="copy-container">
            <button
                onClick={runAction}
                className="copy-button"
                title={isCopied ? "Copied" : "Copy"}
            >
                {isCopied ? (
                    <CopiedIcon iconSize={iconSize} />
                ) : (
                    <CopyIcon iconSize={iconSize} />
                )}
            </button>
        </span>
    );
};

export default CopyButton;
