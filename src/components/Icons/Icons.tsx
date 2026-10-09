import React from "react";

interface IconProps {
    size?: number;
    color?: string;
    className?: string;
}

export const FileIcon: React.FC<IconProps> = ({
    size = 16,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 18 18"
        fill="none"
        className={className}
    >
        <path
            d="M14 0L2 0C0.89 0 0 0.9 0 2L0 16C0 17.1 0.89 18 2 18H16C17.1 18 18 17.1 18 16V4L14 0ZM16 16H2V2H13.17L16 4.83V16ZM9 9C7.34 9 6 10.34 6 12C6 13.66 7.34 15 9 15C10.66 15 12 13.66 12 12C12 10.34 10.66 9 9 9ZM3 3H12V7H3V3Z"
            fill={color}
        />
    </svg>
);

export const FolderIcon: React.FC<IconProps> = ({
    size = 16,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <path
            d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const FolderOpenIcon: React.FC<IconProps> = ({
    size = 16,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <path
            d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M2 10h20"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const SendIcon: React.FC<IconProps> = ({
    size = 20,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <path
            d="M22 2L11 13"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M22 2L15 22L11 13L2 9L22 2Z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const ReceiveIcon: React.FC<IconProps> = ({
    size = 20,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <path
            d="M3 12H21M21 12L15 6M21 12L15 18"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const AccountsIcon: React.FC<IconProps> = ({
    size = 20,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <path
            d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle
            cx="9"
            cy="7"
            r="4"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M23 21v-2a4 4 0 0 0-3-3.87"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M16 3.13a4 4 0 0 1 0 7.75"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const ContractIcon: React.FC<IconProps> = ({
    size = 20,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M14 2v6h6"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M16 13H8"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M16 17H8"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M10 9H9H8"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const IDEIcon: React.FC<IconProps> = ({
    size = 20,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            ry="2"
            stroke={color}
            strokeWidth="2"
        />
        <path
            d="M9 9L12 12L9 15"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M13 15H17"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const WarningIcon: React.FC<IconProps> = ({
    size = 16,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <path
            d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M12 9v4"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M12 17h.01"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const SuccessIcon: React.FC<IconProps> = ({
    size = 16,
    color = "#4CAF50",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
        <path
            d="M9 12l2 2 4-4"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const ErrorIcon: React.FC<IconProps> = ({
    size = 16,
    color = "#f44336",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
        <path
            d="M15 9L9 15"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M9 9L15 15"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const PlusIcon: React.FC<IconProps> = ({
    size = 16,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <path
            d="M12 5v14"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M5 12h14"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const DownloadIcon: React.FC<IconProps> = ({
    size = 16,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <g clipPath="url(#clip0_57_2481)">
            <path
                d="M19 9H15V3H9V9H5L12 16L19 9ZM11 11V5H13V11H14.17L12 13.17L9.83 11H11ZM5 18H19V20H5V18Z"
                fill={color}
            />
        </g>
        <defs>
            <clipPath id="clip0_57_2481">
                <rect width="24" height="24" fill="white" />
            </clipPath>
        </defs>
    </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({
    size = 16,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <path
            d="M9 18l6-6-6-6"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({
    size = 16,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <path
            d="M6 9l6 6 6-6"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const SunIcon: React.FC<IconProps> = ({
    size = 20,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" />
        <path
            d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const LogoutIcon: React.FC<IconProps> = ({
    size = 20,
    color = "currentColor",
    className,
}) => (
    <svg width={size} height={size} className={className} viewBox="0 0 768 768">
        <path
            fill={color}
            d="M127.5 160.5v447h256.5v64.5h-256.5q-25.5 0-44.25-19.5t-18.75-45v-447q0-25.5 18.75-45t44.25-19.5h256.5v64.5h-256.5zM544.5 223.5l159 160.5-159 160.5-45-46.5 82.5-82.5h-325.5v-63h325.5l-82.5-84z"
        />
    </svg>
);

export const MoonIcon: React.FC<IconProps> = ({
    size = 20,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const ClipboardIcon: React.FC<IconProps> = ({
    size = 20,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <path
            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <rect
            x="8"
            y="2"
            width="8"
            height="4"
            rx="1"
            ry="1"
            stroke={color}
            strokeWidth="2"
        />
    </svg>
);

export const PendingIcon: React.FC<IconProps> = ({
    size = 16,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
        <path
            d="M12 6v6l4 2"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const CheckIcon: React.FC<IconProps> = ({
    size = 16,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <path
            d="M20 6L9 17l-5-5"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const MenuIcon: React.FC<IconProps> = ({
    size = 24,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <path
            d="M3 12h18M3 6h18M3 18h18"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const CloseIcon: React.FC<IconProps> = ({
    size = 24,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <path
            d="M18 6L6 18M6 6l12 12"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const DeleteIcon: React.FC<IconProps> = ({
    size = 16,
    color = "#E43A3C",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        className={className}
    >
        <path
            d="M9.41301 6.98L7.99967 8.39333L6.57967 6.98L5.63967 7.92L7.05967 9.33333L5.64634 10.7467L6.58634 11.6867L7.99967 10.2733L9.41301 11.6867L10.353 10.7467L8.93967 9.33333L10.353 7.92L9.41301 6.98ZM10.333 2.66667L9.66634 2H6.33301L5.66634 2.66667H3.33301V4H12.6663V2.66667H10.333ZM3.99967 12.6667C3.99967 13.4 4.59967 14 5.33301 14H10.6663C11.3997 14 11.9997 13.4 11.9997 12.6667V4.66667H3.99967V12.6667ZM5.33301 6H10.6663V12.6667H5.33301V6Z"
            fill={color}
        />
    </svg>
);

export const EditIcon: React.FC<IconProps> = ({
    size = 16,
    color = "#3A3A3A",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        className={className}
    >
        <path
            d="M3.33333 12.6667H4.28333L10.8 6.15L9.85 5.2L3.33333 11.7167V12.6667ZM2 14V11.1667L10.8 2.38333C10.9333 2.26111 11.0806 2.16667 11.2417 2.1C11.4028 2.03333 11.5722 2 11.75 2C11.9278 2 12.1 2.03333 12.2667 2.1C12.4333 2.16667 12.5778 2.26667 12.7 2.4L13.6167 3.33333C13.75 3.45556 13.8472 3.6 13.9083 3.76667C13.9694 3.93333 14 4.1 14 4.26667C14 4.44444 13.9694 4.61389 13.9083 4.775C13.8472 4.93611 13.75 5.08333 13.6167 5.21667L4.83333 14H2ZM10.3167 5.68333L9.85 5.2L10.8 6.15L10.3167 5.68333Z"
            fill={color}
        />
    </svg>
);

export const ExpandIcon: React.FC<IconProps> = ({
    size = 16,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <g clipPath="url(#clip0_1_603)">
            <path
                d="M11.06 5.72667L8 8.78L4.94 5.72667L4 6.66667L8 10.6667L12 6.66667L11.06 5.72667Z"
                fill={color}
            />
        </g>
        <defs>
            <clipPath id="clip0_1_603">
                <rect width="16" height="16" fill="white" />
            </clipPath>
        </defs>
    </svg>
);

export const SearchIcon: React.FC<IconProps> = ({
    size = 16,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <g clipPath="url(#clip0_1_608)">
            <path
                d="M10.3333 9.33333H9.80667L9.62 9.15333C10.2733 8.39333 10.6667 7.40667 10.6667 6.33333C10.6667 3.94 8.72667 2 6.33333 2C3.94 2 2 3.94 2 6.33333C2 8.72667 3.94 10.6667 6.33333 10.6667C7.40667 10.6667 8.39333 10.2733 9.15333 9.62L9.33333 9.80667V10.3333L12.6667 13.66L13.66 12.6667L10.3333 9.33333ZM6.33333 9.33333C4.67333 9.33333 3.33333 7.99333 3.33333 6.33333C3.33333 4.67333 4.67333 3.33333 6.33333 3.33333C7.99333 3.33333 9.33333 4.67333 9.33333 6.33333C9.33333 7.99333 7.99333 9.33333 6.33333 9.33333Z"
                fill={color}
            />
        </g>
        <defs>
            <clipPath id="clip0_1_608">
                <rect width="16" height="16" fill="white" />
            </clipPath>
        </defs>
    </svg>
);

export const FilterIcon: React.FC<IconProps> = ({
    size = 16,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
    >
        <path
            d="M2.5 3.5h11l-4 4.75V12.5L6.5 13.5V8.25L2.5 3.5Z"
            stroke={color}
            strokeWidth="1.25"
            strokeLinejoin="round"
        />
    </svg>
);

export const CopyIcon: React.FC<IconProps> = ({
    size = 16,
    color = "#3A3A3A",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <g clipPath="url(#clip0_97_200)">
            <path
                d="M10.6667 0.666668H2.66668C1.93334 0.666668 1.33334 1.26667 1.33334 2V11.3333H2.66668V2H10.6667V0.666668ZM12.6667 3.33333H5.33334C4.60001 3.33333 4.00001 3.93333 4.00001 4.66667V14C4.00001 14.7333 4.60001 15.3333 5.33334 15.3333H12.6667C13.4 15.3333 14 14.7333 14 14V4.66667C14 3.93333 13.4 3.33333 12.6667 3.33333ZM12.6667 14H5.33334V4.66667H12.6667V14Z"
                fill={color}
            />
        </g>
        <defs>
            <clipPath id="clip0_97_200">
                <rect width="16" height="16" fill="white" />
            </clipPath>
        </defs>
    </svg>
);

export const PreviewIcon: React.FC<IconProps> = ({
    size = 24,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <g clipPath="url(#clip0_57_998)">
            <path
                d="M19 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.11 3 19 3ZM19 19H5V7H19V19ZM12 10.5C13.84 10.5 15.48 11.46 16.34 13C15.48 14.54 13.84 15.5 12 15.5C10.16 15.5 8.52 14.54 7.66 13C8.52 11.46 10.16 10.5 12 10.5ZM12 9C9.27 9 6.94 10.66 6 13C6.94 15.34 9.27 17 12 17C14.73 17 17.06 15.34 18 13C17.06 10.66 14.73 9 12 9ZM12 14.5C11.17 14.5 10.5 13.83 10.5 13C10.5 12.17 11.17 11.5 12 11.5C12.83 11.5 13.5 12.17 13.5 13C13.5 13.83 12.83 14.5 12 14.5Z"
                fill={color}
            />
        </g>
        <defs>
            <clipPath id="clip0_57_998">
                <rect width="24" height="24" fill="white" />
            </clipPath>
        </defs>
    </svg>
);

export const ReloadIcon: React.FC<IconProps> = ({
    size = 24,
    color = "#3A3A3A",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M12 6V9L16 5L12 1V4C7.58 4 4 7.58 4 12C4 13.57 4.46 15.03 5.24 16.26L6.7 14.8C6.25 13.97 6 13.01 6 12C6 8.69 8.69 6 12 6ZM18.76 7.74L17.3 9.2C17.74 10.04 18 10.99 18 12C18 15.31 15.31 18 12 18V15L8 19L12 23V20C16.42 20 20 16.42 20 12C20 10.43 19.54 8.97 18.76 7.74Z"
            fill={color}
        />
    </svg>
);

export const LockPassIcon: React.FC<IconProps> = ({
    size = 24,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <g clipPath="url(#clip0_97_211)">
            <path
                d="M15.207 18.707L13.414 20.5L15.207 22.293L13.793 23.707L12 21.914L10.207 23.707L8.793 22.293L10.586 20.5L8.793 18.707L10.207 17.293L12 19.086L13.793 17.293L15.207 18.707ZM23.207 18.707L21.793 17.293L20 19.086L18.207 17.293L16.793 18.707L18.586 20.5L16.793 22.293L18.207 23.707L20 21.914L21.793 23.707L23.207 22.293L21.414 20.5L23.207 18.707ZM5.793 17.293L4 19.086L2.207 17.293L0.792999 18.707L2.586 20.5L0.792999 22.293L2.207 23.707L4 21.914L5.793 23.707L7.207 22.293L5.414 20.5L7.207 18.707L5.793 17.293ZM6 12V5H8V4C8 1.794 9.794 0 12 0C14.206 0 16 1.794 16 4V5H18V12C18 13.654 16.654 15 15 15H9C7.346 15 6 13.654 6 12ZM13 9H11V11H13V9ZM10 5H14V4C14 2.897 13.103 2 12 2C10.897 2 10 2.897 10 4V5Z"
                fill={color}
            />
        </g>
        <defs>
            <clipPath id="clip0_97_211">
                <rect width="24" height="24" fill="white" />
            </clipPath>
        </defs>
    </svg>
);

export const VectorIcon: React.FC<IconProps> = ({
    size = 16,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M0 8L1.41 9.41L7 3.83V16H9V3.83L14.58 9.42L16 8L8 0L0 8Z"
            fill={color}
        />
    </svg>
);

export const HistoryIcon: React.FC<IconProps> = ({
    size = 16,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M8.6665 2C5.35317 2 2.6665 4.68667 2.6665 8H0.666504L3.25984 10.5933L3.3065 10.6867L5.99984 8H3.99984C3.99984 5.42 6.0865 3.33333 8.6665 3.33333C11.2465 3.33333 13.3332 5.42 13.3332 8C13.3332 10.58 11.2465 12.6667 8.6665 12.6667C7.37984 12.6667 6.21317 12.14 5.37317 11.2933L4.4265 12.24C5.51317 13.3267 7.0065 14 8.6665 14C11.9798 14 14.6665 11.3133 14.6665 8C14.6665 4.68667 11.9798 2 8.6665 2ZM7.99984 5.33333V8.66667L10.8332 10.3467L11.3465 9.49333L8.99984 8.1V5.33333H7.99984Z"
            fill={color}
        />
    </svg>
);

export const ContentPasteIcon: React.FC<IconProps> = ({
    size = 16,
    color = "#3A3A3A",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <g clipPath="url(#clip0_1_640)">
            <path
                d="M12.6667 1.33333H9.88C9.6 0.56 8.86667 0 8 0C7.13333 0 6.4 0.56 6.12 1.33333H3.33333C2.6 1.33333 2 1.93333 2 2.66667V13.3333C2 14.0667 2.6 14.6667 3.33333 14.6667H12.6667C13.4 14.6667 14 14.0667 14 13.3333V2.66667C14 1.93333 13.4 1.33333 12.6667 1.33333ZM8 1.33333C8.36667 1.33333 8.66667 1.63333 8.66667 2C8.66667 2.36667 8.36667 2.66667 8 2.66667C7.63333 2.66667 7.33333 2.36667 7.33333 2C7.33333 1.63333 7.63333 1.33333 8 1.33333ZM12.6667 13.3333H3.33333V2.66667H4.66667V4.66667H11.3333V2.66667H12.6667V13.3333Z"
                fill={color}
            />
        </g>
        <defs>
            <clipPath id="clip0_1_640">
                <rect width="16" height="16" fill="white" />
            </clipPath>
        </defs>
    </svg>
);

export const QRIcon: React.FC<IconProps> = ({
    size = 24,
    color = "#3A3A3A",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <g clipPath="url(#clip0_144_829)">
            <path
                d="M9.5 6.5V9.5H6.5V6.5H9.5ZM11 5H5V11H11V5ZM9.5 14.5V17.5H6.5V14.5H9.5ZM11 13H5V19H11V13ZM17.5 6.5V9.5H14.5V6.5H17.5ZM19 5H13V11H19V5ZM13 13H14.5V14.5H13V13ZM14.5 14.5H16V16H14.5V14.5ZM16 13H17.5V14.5H16V13ZM13 16H14.5V17.5H13V16ZM14.5 17.5H16V19H14.5V17.5ZM16 16H17.5V17.5H16V16ZM17.5 14.5H19V16H17.5V14.5ZM17.5 17.5H19V19H17.5V17.5ZM22 7H20V4H17V2H22V7ZM22 22V17H20V20H17V22H22ZM2 22H7V20H4V17H2V22ZM2 2V7H4V4H7V2H2Z"
                fill={color}
            />
        </g>
        <defs>
            <clipPath id="clip0_144_829">
                <rect width="24" height="24" fill="white" />
            </clipPath>
        </defs>
    </svg>
);

export const FileCopyIcon: React.FC<IconProps> = ({
    size = 16,
    color = "#3A3A3A",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <g clipPath="url(#clip0_1_241)">
            <path
                d="M10.6666 0.666667H2.66659C1.93325 0.666667 1.33325 1.26667 1.33325 2V11.3333H2.66659V2H10.6666V0.666667ZM9.99992 3.33333H5.33325C4.59992 3.33333 4.00659 3.93333 4.00659 4.66667L3.99992 14C3.99992 14.7333 4.59325 15.3333 5.32659 15.3333H12.6666C13.3999 15.3333 13.9999 14.7333 13.9999 14V7.33333L9.99992 3.33333ZM5.33325 14V4.66667H9.33325V8H12.6666V14H5.33325Z"
                fill={color}
            />
        </g>
        <defs>
            <clipPath id="clip0_1_241">
                <rect width="16" height="16" fill="white" />
            </clipPath>
        </defs>
    </svg>
);

export const QRIconSecond: React.FC<IconProps> = ({
    size = 24,
    color = "#5A9C4F",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <g clipPath="url(#clip0_144_501)">
            <path d="M3 11H11V3H3V11ZM5 5H9V9H5V5Z" fill={color} />
            <path d="M3 21H11V13H3V21ZM5 15H9V19H5V15Z" fill={color} />
            <path d="M13 3V11H21V3H13ZM19 9H15V5H19V9Z" fill={color} />
            <path d="M21 19H19V21H21V19Z" fill={color} />
            <path d="M15 13H13V15H15V13Z" fill={color} />
            <path d="M17 15H15V17H17V15Z" fill={color} />
            <path d="M15 17H13V19H15V17Z" fill={color} />
            <path d="M17 19H15V21H17V19Z" fill={color} />
            <path d="M19 17H17V19H19V17Z" fill={color} />
            <path d="M19 13H17V15H19V13Z" fill={color} />
            <path d="M21 15H19V17H21V15Z" fill={color} />
        </g>
        <defs>
            <clipPath id="clip0_144_501">
                <rect width="24" height="24" fill="white" />
            </clipPath>
        </defs>
    </svg>
);

export const VisibilityIcon: React.FC<IconProps> = ({
    size = 24,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M12 6a9.77 9.77 0 0 1 8.82 5.5C19.17 14.87 15.79 17 12 17s-7.17-2.13-8.82-5.5A9.77 9.77 0 0 1 12 6m0-2C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4m0 5a2.5 2.5 0 0 1 0 5a2.5 2.5 0 0 1 0-5m0-2c-2.48 0-4.5 2.02-4.5 4.5S9.52 16 12 16s4.5-2.02 4.5-4.5S14.48 7 12 7"
            fill={color}
        />
    </svg>
);

export const ExploreIcon: React.FC<IconProps> = ({
    size = 24,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <g clipPath="url(#clip0_964_3412)">
            <path
                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM6.5 17.5L14.01 14.01L17.5 6.5L9.99 9.99L6.5 17.5ZM12 10.9C12.61 10.9 13.1 11.39 13.1 12C13.1 12.61 12.61 13.1 12 13.1C11.39 13.1 10.9 12.61 10.9 12C10.9 11.39 11.39 10.9 12 10.9Z"
                fill={color}
            />
        </g>
        <defs>
            <clipPath id="clip0_964_3412">
                <rect width="24" height="24" fill="white" />
            </clipPath>
        </defs>
    </svg>
);

export const VisibilityOffIcon: React.FC<IconProps> = ({
    size = 24,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M12 6a9.77 9.77 0 0 1 8.82 5.5a9.65 9.65 0 0 1-2.41 3.12l1.41 1.41c1.39-1.23 2.49-2.77 3.18-4.53C21.27 7.11 17 4 12 4c-1.27 0-2.49.2-3.64.57l1.65 1.65C10.66 6.09 11.32 6 12 6m-1.07 1.14L13 9.21c.57.25 1.03.71 1.28 1.28l2.07 2.07c.08-.34.14-.7.14-1.07C16.5 9.01 14.48 7 12 7c-.37 0-.72.05-1.07.14M2.01 3.87l2.68 2.68A11.74 11.74 0 0 0 1 11.5C2.73 15.89 7 19 12 19c1.52 0 2.98-.29 4.32-.82l3.42 3.42l1.41-1.41L3.42 2.45zm7.5 7.5l2.61 2.61c-.04.01-.08.02-.12.02a2.5 2.5 0 0 1-2.5-2.5c0-.05.01-.08.01-.13m-3.4-3.4l1.75 1.75a4.6 4.6 0 0 0-.36 1.78a4.507 4.507 0 0 0 6.27 4.14l.98.98c-.88.24-1.8.38-2.75.38a9.77 9.77 0 0 1-8.82-5.5c.7-1.43 1.72-2.61 2.93-3.53"
            fill={color}
        />
    </svg>
);

export const ExternalIcon: React.FC<IconProps> = ({
    size = 12,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={className}
    >
        <path
            d="M10.6667 10.6667H1.33333V1.33333H6V0H1.33333C0.593333 0 0 0.6 0 1.33333V10.6667C0 11.4 0.593333 12 1.33333 12H10.6667C11.4 12 12 11.4 12 10.6667V6H10.6667V10.6667ZM7.33333 0V1.33333H9.72667L3.17333 7.88667L4.11333 8.82667L10.6667 2.27333V4.66667H12V0H7.33333Z"
            fill={color}
        />
    </svg>
);

export const OutwardIcon: React.FC<IconProps> = ({
    size = 24,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <g clipPath="url(#clip0_5_1831)">
            <path
                d="M9 5V7H15.59L4 18.59L5.41 20L17 8.41V15H19V5H9Z"
                fill={color}
            />
        </g>
        <defs>
            <clipPath id="clip0_5_1831">
                <rect width="24" height="24" fill="white" />
            </clipPath>
        </defs>
    </svg>
);

export const InwardIcon: React.FC<IconProps> = ({
    size = 24,
    color = "currentColor",
    className,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <g clipPath="url(#clip0_5_1850)">
            <path
                d="M15 19V17H8.41L20 5.41L18.59 4L7 15.59V9H5V19H15Z"
                fill={color}
            />
        </g>
        <defs>
            <clipPath id="clip0_5_1850">
                <rect width="24" height="24" fill="white" />
            </clipPath>
        </defs>
    </svg>
);

interface IAccountCardBackgroundProps {
    color?: string;
    className?: string;
}

export const AccountCardBackground: React.FC<IAccountCardBackgroundProps> = ({
    color = "currentColor",
    className,
}) => (
    <svg
        width="100%"
        height="100%"
        viewBox="0 0 624 279"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={className}
    >
        <path
            d="M123.193 181.745C129.514 181.622 134.672 177.706 136.097 172.376C136.144 172.203 136.185 172.031 136.225 171.855C136.4 171.056 136.49 170.228 136.494 169.38C136.64 161.223 129.711 157.198 122.862 157.305C118.123 157.374 113.418 159.427 111.128 163.466C110.211 165.079 109.68 167.011 109.687 169.256C109.73 170.237 109.708 171.148 109.634 172.002C109.627 172.056 109.624 172.111 109.618 172.163C109.618 172.177 109.615 172.192 109.612 172.206C109.49 173.385 109.259 174.446 108.928 175.403C106.532 182.349 99.0162 183.881 92.0055 185.808C87.5252 187.035 83.2508 188.427 80.655 191.506C79.4943 192.88 78.6738 194.594 78.3181 196.779C78.2401 197.259 78.1839 197.762 78.1496 198.291C78.1059 200.893 78.9577 203.328 80.4428 205.349C82.7984 208.557 86.7546 210.725 91.2848 210.863C104.289 210.219 106.573 218.456 109.091 226.331C110.392 230.41 111.758 234.392 114.716 236.994C114.794 237.063 114.872 237.129 114.95 237.195C114.956 237.198 114.959 237.204 114.966 237.207C116.622 238.581 118.763 239.536 121.63 239.863C122.179 239.927 122.756 239.967 123.362 239.984C123.655 239.984 123.945 239.973 124.226 239.955C132.625 239.49 136.593 232.843 136.116 226.555C136.038 225.531 135.845 224.517 135.53 223.539C134.051 218.939 129.954 215.184 123.237 215.23C111.125 215.273 105.156 206.502 105.403 197.923C105.643 189.732 111.549 181.722 123.187 181.745H123.193Z"
            fill={color}
        />
        <path
            d="M501.474 215.227C490.592 215.098 486.542 224.844 489.26 232.141C489.294 232.233 489.328 232.322 489.366 232.414C489.372 232.434 489.381 232.454 489.391 232.474C489.419 232.543 489.447 232.615 489.475 232.684C489.506 232.756 489.537 232.825 489.569 232.897C489.578 232.914 489.584 232.934 489.593 232.952C490.76 235.522 492.816 237.713 495.759 238.937C495.759 238.937 495.759 238.937 495.762 238.937C495.852 238.975 495.943 239.009 496.033 239.047C496.046 239.052 496.058 239.055 496.067 239.061C496.152 239.093 496.236 239.124 496.32 239.153C496.342 239.159 496.361 239.167 496.383 239.176C496.451 239.199 496.52 239.222 496.589 239.245C496.626 239.259 496.663 239.271 496.701 239.285C496.763 239.305 496.829 239.326 496.894 239.346C496.938 239.36 496.982 239.374 497.028 239.386C497.094 239.406 497.16 239.423 497.222 239.44C497.269 239.452 497.312 239.466 497.359 239.478C497.418 239.495 497.478 239.51 497.54 239.524C497.593 239.538 497.646 239.55 497.699 239.564C497.749 239.576 497.799 239.587 497.849 239.599C497.915 239.613 497.98 239.63 498.046 239.642C498.083 239.65 498.124 239.656 498.161 239.665C498.239 239.679 498.317 239.696 498.398 239.711C498.429 239.717 498.464 239.722 498.498 239.728C498.585 239.742 498.67 239.76 498.757 239.774C498.794 239.78 498.829 239.785 498.866 239.791C498.95 239.803 499.035 239.817 499.122 239.829C499.172 239.834 499.222 239.84 499.275 239.846C499.347 239.855 499.421 239.866 499.493 239.872C499.546 239.877 499.599 239.883 499.652 239.886C499.724 239.892 499.796 239.9 499.868 239.906C499.93 239.912 499.996 239.915 500.058 239.921C500.123 239.926 500.186 239.932 500.251 239.935C500.317 239.938 500.382 239.941 500.448 239.944C500.513 239.946 500.576 239.949 500.641 239.952C500.713 239.952 500.788 239.955 500.86 239.958C500.919 239.958 500.978 239.961 501.038 239.964C501.119 239.964 501.203 239.964 501.284 239.964C501.337 239.964 501.387 239.964 501.44 239.964C501.78 239.969 502.114 239.964 502.439 239.952C502.464 239.952 502.488 239.952 502.513 239.949C502.651 239.944 502.788 239.938 502.922 239.926C503.081 239.915 503.24 239.901 503.396 239.886C503.399 239.886 503.406 239.886 503.409 239.886C503.531 239.875 503.649 239.86 503.768 239.846C503.799 239.843 503.827 239.837 503.855 239.834C503.949 239.823 504.042 239.808 504.133 239.797C504.161 239.794 504.186 239.788 504.214 239.783C504.307 239.768 504.401 239.754 504.491 239.737C504.52 239.731 504.548 239.725 504.576 239.722C504.666 239.705 504.757 239.688 504.844 239.671C504.881 239.662 504.922 239.653 504.959 239.645C505.037 239.627 505.115 239.613 505.19 239.596C505.231 239.587 505.271 239.576 505.312 239.564C505.384 239.547 505.459 239.53 505.53 239.509C505.559 239.501 505.59 239.495 505.618 239.487C505.699 239.464 505.783 239.443 505.864 239.42C505.892 239.412 505.917 239.403 505.942 239.397C506.027 239.374 506.108 239.348 506.192 239.323C506.229 239.311 506.267 239.297 506.304 239.285C506.376 239.262 506.445 239.239 506.513 239.216C506.544 239.205 506.573 239.193 506.604 239.185C506.679 239.159 506.753 239.13 506.828 239.104C506.853 239.095 506.878 239.084 506.903 239.075C506.981 239.047 507.059 239.015 507.137 238.983C507.147 238.981 507.156 238.975 507.165 238.972C507.359 238.891 507.549 238.808 507.736 238.719C507.743 238.716 507.752 238.713 507.758 238.707C507.945 238.618 508.129 238.526 508.31 238.428C508.313 238.428 508.32 238.423 508.323 238.42C508.476 238.336 508.625 238.25 508.775 238.161C510.6 237.063 511.995 235.539 512.947 233.791C512.965 233.759 512.981 233.728 512.997 233.696C513.028 233.642 513.056 233.587 513.084 233.532C513.103 233.495 513.121 233.458 513.14 233.42C513.165 233.371 513.19 233.323 513.215 233.271C513.249 233.202 513.281 233.133 513.312 233.064C513.321 233.044 513.33 233.026 513.34 233.006C516.716 225.615 512.791 215.023 501.462 215.221L501.474 215.227Z"
            fill={color}
        />
        <path
            d="M624 -109.087V-133.665C619.014 -132.406 616.662 -128.83 614.996 -124.603C612.734 -118.868 611.723 -111.95 607.04 -108.066C604.618 -106.057 601.215 -104.861 596.151 -105.056C596.029 -105.062 595.911 -105.065 595.786 -105.071C595.755 -105.071 595.723 -105.068 595.692 -105.065C587.493 -104.628 584.757 -99.3579 582.701 -93.4153C581.368 -89.5686 580.323 -85.4401 578.267 -82.1597C577.06 -80.2334 575.503 -78.5976 573.334 -77.4878C571.119 -76.3522 568.267 -75.7571 564.492 -75.9554C563.609 -75.9554 562.758 -76.0014 561.94 -76.0906C554.343 -76.9358 549.597 -81.6307 547.75 -87.2398C545.941 -92.7426 546.92 -99.1251 550.736 -103.63C553.685 -107.112 558.324 -109.469 564.676 -109.438C568.015 -109.507 571 -110.616 573.287 -112.442C576.105 -114.69 577.871 -118.022 577.933 -121.846C577.933 -121.855 577.933 -121.863 577.933 -121.872C578.017 -126.521 579.999 -130.647 583.215 -133.631C586.445 -136.629 590.919 -138.478 595.964 -138.556C596.179 -138.559 596.394 -138.567 596.606 -138.579C602.818 -138.921 607.813 -142.834 609.096 -148.003H582.585C582.46 -146.637 582.18 -145.427 581.758 -144.357C579.958 -139.795 575.665 -137.699 570.848 -136.167C564.792 -134.24 557.909 -133.2 554.084 -129.267C552.312 -127.444 551.198 -125 551.129 -121.556C550.992 -113.903 545.345 -107.529 537.651 -105.64C537.401 -105.579 537.152 -105.522 536.899 -105.47C536.465 -105.381 536.028 -105.309 535.582 -105.249C534.843 -105.148 534.088 -105.091 533.32 -105.073C531.274 -105.03 529.554 -104.708 528.094 -104.165C523.199 -102.345 521.224 -98.0268 519.645 -93.3003C518.191 -88.9476 517.074 -84.2498 514.329 -80.8429C511.883 -77.8069 508.142 -75.7916 501.712 -75.9554C501.449 -75.9583 501.194 -75.9554 500.941 -75.9497C495.618 -75.7944 492.005 -73.3133 490.071 -69.9812C487.363 -65.3122 487.955 -58.9699 491.777 -54.9823C493.943 -52.7226 497.144 -51.2189 501.371 -51.2046C504.488 -51.1729 507.315 -52.0958 509.565 -53.7029C512.738 -55.9656 514.772 -59.5881 514.865 -63.8287V-63.8344C514.825 -85.2733 551.292 -85.2388 551.126 -63.7942C551.126 -63.7856 551.126 -63.7769 551.126 -63.7654C551.466 -57.5238 549.192 -53.9674 545.725 -51.6617C542.022 -49.1978 536.964 -48.1599 532.281 -46.8001C529.061 -45.8657 526.023 -44.7761 523.726 -42.9706C521.489 -41.2111 519.954 -38.7702 519.645 -35.1218C519.623 -34.8516 519.605 -34.5756 519.595 -34.2909C519.517 -29.7916 517.558 -25.7321 514.416 -22.7593C511.156 -19.6716 506.622 -17.7511 501.599 -17.7223C501.587 -17.7223 501.577 -17.7223 501.565 -17.7223C501.418 -17.7166 501.275 -17.7137 501.128 -17.7079C493.902 -17.5239 490.102 -20.1862 487.7 -23.9668C482.346 -32.3963 483.928 -46.3861 469.931 -46.8317C469.835 -46.8346 469.741 -46.8374 469.641 -46.8403C461.607 -47.0186 454.899 -51.9176 452.625 -58.6623C452.472 -59.1108 452.341 -59.5708 452.228 -60.0366C451.973 -61.1003 451.826 -62.2014 451.798 -63.3313C451.779 -64.0271 451.717 -64.7027 451.611 -65.3553C450.572 -71.6631 445.427 -75.8174 438.195 -75.9554C437.97 -75.9497 437.752 -75.9468 437.536 -75.9439C424.098 -75.8778 422.885 -85.8598 419.964 -94.1571C417.961 -99.8496 415.153 -104.746 407.045 -105.062C406.948 -105.065 406.848 -105.071 406.748 -105.073C406.63 -105.073 406.514 -105.073 406.399 -105.076C399.694 -105.18 394.945 -108.078 392.162 -112.132C389.682 -115.745 388.761 -120.271 389.41 -124.554C390.527 -131.923 396.29 -138.564 406.742 -138.553H406.767C412.81 -140.45 416.021 -142.172 417.768 -143.699C418.773 -144.973 419.506 -146.427 419.896 -148H393.242C392.193 -140.841 386.506 -136.497 379.941 -135.12C370.494 -133.105 359.249 -137.216 357.415 -148H330.895C330.929 -147.874 330.96 -147.744 330.998 -147.621C332.732 -141.945 337.459 -138.745 344.579 -138.55C344.601 -138.55 344.623 -138.55 344.645 -138.55C367.286 -138.093 367.034 -105.094 344.12 -105.071C339.496 -104.208 336.189 -102.802 333.949 -101.086C330.149 -98.1763 329.419 -94.3727 330.533 -90.7991C331.799 -86.7453 335.441 -82.9877 339.684 -81.1621C343.977 -79.3163 348.882 -79.4486 352.563 -83.2522C354.569 -85.3251 356.214 -88.4876 357.199 -93.0157C357.199 -93.0157 357.199 -93.0186 357.199 -93.0214C357.246 -101.73 363.302 -106.89 370.45 -108.486C380.843 -110.806 393.544 -105.597 393.457 -92.8001C393.457 -92.7541 393.46 -92.7081 393.463 -92.6621C393.653 -85.9173 399.042 -80.7739 406.258 -80.3456C406.505 -80.3312 406.751 -80.3197 407.001 -80.3168C411.356 -79.4284 414.823 -78.1807 417.521 -76.6799C420.183 -75.1993 422.099 -73.4743 423.381 -71.6142C425.696 -68.2533 425.949 -64.4468 424.813 -60.8272C423.153 -55.5314 418.526 -50.6411 413.051 -48.1398C407.216 -45.4718 400.418 -45.5207 395.229 -50.6842C392.493 -53.4068 390.2 -57.5554 388.733 -63.4779V-63.4837C388.655 -67.6323 386.68 -71.1686 383.56 -73.4053C381.305 -75.0211 378.45 -75.9612 375.277 -75.9497C371.954 -75.9382 368.959 -74.8428 366.65 -73.0086C363.801 -70.7459 362.001 -67.3563 361.932 -63.4722C361.945 -55.3819 356.878 -50.3248 350.529 -48.2893C341.759 -45.4804 330.545 -48.4417 326.885 -57.1587C326.112 -59.0044 325.675 -61.1089 325.672 -63.4751C325.672 -63.5872 325.662 -63.6964 325.659 -63.8057C325.566 -65.7406 325.132 -67.3477 324.433 -68.6989C322.171 -73.0689 317.135 -74.7709 311.803 -76.2631C305.766 -77.9536 299.355 -79.3709 296.163 -84.0859C294.725 -86.2134 293.941 -89.0079 294.144 -92.8001C294.001 -95.8619 294.509 -98.2683 295.492 -100.192C297.829 -104.774 302.852 -106.629 308.141 -108.135C315.245 -110.156 322.829 -111.551 325.038 -118.086C325.366 -119.052 325.575 -120.136 325.647 -121.346C325.659 -121.556 325.669 -121.769 325.675 -121.987C325.681 -123.982 325.263 -125.725 324.527 -127.22C322.702 -130.914 318.923 -133.073 314.814 -133.688C307.323 -134.815 298.731 -130.825 298.871 -121.717C298.871 -121.717 298.871 -121.717 298.871 -121.714C298.784 -116.852 296.55 -112.52 293.018 -109.495C289.764 -106.706 285.411 -105.025 280.622 -105.065C279.702 -105.065 278.819 -105.114 277.973 -105.211C270.551 -106.077 265.893 -110.665 264.027 -116.177C262.167 -121.671 263.088 -128.079 266.822 -132.625C269.724 -136.158 274.323 -138.567 280.641 -138.55H280.644C286.684 -140.447 289.895 -142.17 291.642 -143.696C292.65 -144.97 293.38 -146.425 293.77 -147.997H267.122C267.122 -147.997 267.122 -147.983 267.119 -147.974C267.109 -147.908 267.1 -147.842 267.091 -147.776C265.992 -140.956 260.651 -136.736 254.402 -135.247C246.985 -133.478 238.29 -135.548 233.891 -141.675C232.621 -143.44 231.716 -145.551 231.298 -147.997H204.064C203.046 -141.045 197.658 -136.753 191.34 -135.247C184.152 -133.533 175.765 -135.428 171.251 -141.12C169.762 -142.998 168.708 -145.292 168.24 -148H141.717C143.355 -142.092 148.125 -138.751 155.401 -138.55C155.423 -138.55 155.442 -138.55 155.463 -138.55C178.099 -138.099 177.787 -105.134 155.039 -105.071C154.952 -105.071 154.867 -105.071 154.78 -105.071C154.68 -105.065 154.577 -105.062 154.477 -105.059C151.089 -104.921 148.443 -105.427 146.34 -106.393C141.386 -108.667 139.42 -113.494 137.76 -118.5C136.11 -123.471 134.759 -128.611 131.071 -131.601C129.152 -133.156 126.597 -134.128 123.04 -134.189C122.981 -134.189 122.922 -134.191 122.862 -134.191C122.788 -134.191 122.713 -134.191 122.641 -134.186C115.481 -134.025 111.371 -129.612 110.308 -124.552C109.446 -120.455 110.585 -115.935 113.721 -112.914C115.958 -110.76 119.212 -109.366 123.48 -109.435C127.312 -109.556 130.182 -108.866 132.394 -107.629C136.497 -105.332 138.328 -101.149 139.813 -96.7331C141.526 -91.6357 142.774 -86.2336 146.512 -83.0711C148.425 -81.4524 150.986 -80.4203 154.596 -80.3168C154.602 -80.3168 154.612 -80.3168 154.618 -80.3168C154.699 -80.3168 154.78 -80.3226 154.861 -80.3254C163.716 -80.6503 166.206 -86.7137 168.352 -93.2227C171.017 -101.316 173.154 -110.102 186.314 -109.435C186.339 -109.435 186.364 -109.435 186.389 -109.432C186.42 -109.432 186.448 -109.432 186.479 -109.432C190.139 -109.55 192.922 -108.94 195.09 -107.825C199.792 -105.404 201.602 -100.6 203.193 -95.6779C204.738 -90.8911 206.07 -85.9892 209.642 -83.0452C211.611 -81.4237 214.26 -80.3973 217.998 -80.3139C241.129 -80.3427 241.154 -46.8691 218.007 -46.8317C213.62 -46.7397 209.988 -45.1814 207.567 -42.5824C205.957 -40.8546 204.878 -38.6696 204.469 -36.1453C204.363 -35.4927 204.304 -34.8142 204.288 -34.1156C202.85 -28.4116 200.635 -24.3808 197.989 -21.6956C192.81 -16.4458 185.983 -16.3509 180.108 -18.9988C174.542 -21.5087 169.834 -26.4767 168.199 -31.8472C166.736 -36.6628 167.741 -41.8004 172.817 -45.7766C175.725 -48.0564 179.971 -49.9539 185.855 -51.1902C185.855 -51.1902 185.858 -51.1902 185.862 -51.1902C190.173 -51.2563 193.88 -52.8893 196.348 -55.5056C198.376 -57.6561 199.568 -60.4707 199.558 -63.6274C199.58 -67.4081 198.101 -70.2946 195.824 -72.2927C191.506 -76.0819 184.323 -76.6627 179.119 -74.0177C175.553 -72.2064 172.917 -68.8829 172.761 -64.0414C172.754 -63.7999 172.751 -63.5527 172.758 -63.3026C172.68 -58.9038 170.764 -54.9191 167.697 -51.9722C164.402 -48.8011 159.778 -46.8259 154.671 -46.8231C154.658 -46.8231 154.646 -46.8231 154.633 -46.8231C154.534 -46.8202 154.437 -46.8173 154.34 -46.8144C150.605 -46.6908 147.779 -47.3463 145.589 -48.5337C141.139 -50.9458 139.302 -55.5602 137.729 -60.3241C136.041 -65.4444 134.659 -70.7402 130.675 -73.6612C128.806 -75.0326 126.363 -75.8807 123.047 -75.9439C123.04 -75.9439 123.034 -75.9439 123.028 -75.9439H123.025C122.71 -75.9353 122.401 -75.9181 122.098 -75.8922C121.951 -75.8807 121.805 -75.8663 121.661 -75.8519C113.902 -75.0498 111.503 -69.5327 109.531 -63.5211C106.869 -55.3992 104.985 -46.3717 91.7311 -46.8259C91.4098 -46.8288 91.0946 -46.8231 90.7858 -46.8087C83.8594 -46.5011 79.8689 -42.2058 78.7894 -37.2781C77.5476 -31.6057 80.1621 -25.0967 86.6018 -22.8686C88.0994 -22.3511 89.7998 -22.0636 91.7093 -22.0751C96.4423 -22.0061 100.679 -20.3673 103.852 -17.6936C103.871 -17.6763 103.893 -17.6619 103.912 -17.6447C103.915 -17.6418 103.921 -17.6361 103.924 -17.6332C107.518 -14.5713 109.724 -10.1697 109.696 -5.2247V-5.17583C109.74 2.33942 105.294 7.23843 99.503 9.50105C95.1288 11.2088 89.987 11.4158 85.4318 10.1048C78.8455 8.21017 73.4822 3.15018 73.4354 -5.10394C73.4354 -5.16432 73.4323 -5.22182 73.4292 -5.2822C73.3325 -8.05945 72.5587 -10.1755 71.3169 -11.8372C68.7149 -15.3045 64.0567 -16.7822 59.202 -18.1306C54.1601 -19.5278 48.906 -20.7871 45.5239 -23.9841C43.1059 -26.2697 41.6458 -29.5501 41.9078 -34.5813C41.886 -35.0959 41.8829 -35.5904 41.8985 -36.0648C42.173 -45.7306 49.4707 -48.1456 56.9774 -50.2012C64.8991 -52.3689 73.0517 -54.1313 73.4386 -63.5786C73.4386 -63.5958 73.4386 -63.6131 73.4386 -63.6303C73.5197 -68.3223 75.5321 -72.4738 78.7987 -75.4638C82.0279 -78.4193 86.477 -80.2392 91.494 -80.3168C91.6968 -80.3168 91.8965 -80.3168 92.093 -80.3197C97.5374 -80.4376 101.213 -83.0711 103.113 -86.5814C105.665 -91.2993 105.019 -97.5956 101.169 -101.491C99.0225 -103.662 95.8807 -105.088 91.7405 -105.068C88.5518 -104.993 86.1619 -104.225 84.3117 -102.98C81.0701 -100.801 79.4882 -97.1614 78.1716 -93.2486C76.7052 -88.8843 75.5664 -84.1837 72.8177 -80.7797C70.331 -77.7006 66.5277 -75.6823 59.9664 -75.9497C59.7293 -75.9468 59.4953 -75.9382 59.2613 -75.9238C52.2194 -75.5069 46.8094 -70.3549 46.6253 -63.7597C46.6253 -63.7482 46.6253 -63.7338 46.6253 -63.7223C46.6253 -54.4217 40.1918 -49.0598 32.7506 -47.6137C28.7165 -46.8288 24.3859 -47.1968 20.617 -48.7062C14.7982 -51.0407 10.3241 -56.1064 10.3646 -63.8891C10.3646 -63.8977 10.3646 -63.9063 10.3646 -63.9178C8.25239 -69.2509 6.36791 -72.1317 4.71743 -73.7129C3.31655 -74.6272 1.71599 -75.2913 0.00311279 -75.6363V-51.1356C3.79391 -50.8596 6.46463 -49.6262 8.44583 -47.8121C12.1867 -44.3851 13.4722 -38.8881 15.2006 -33.8511C16.7482 -29.3373 18.6576 -25.1973 23.01 -23.2481C24.6979 -22.4919 26.7509 -22.0664 29.2968 -22.0779C34.9346 -21.9198 39.9173 -19.2921 43.0747 -15.3246C45.3274 -12.4956 46.6565 -8.99094 46.6315 -5.21606C46.8624 0.375809 44.9623 3.77693 41.9952 6.05106C38.2512 8.92319 32.8099 10.0099 27.7961 11.4532C22.6668 12.9309 17.9868 14.7882 16.0462 19.3221C15.4721 20.6618 15.1351 22.2344 15.1008 24.1032C15.1008 24.1089 15.1008 24.1176 15.1008 24.1233C15.029 27.7027 13.831 30.9083 11.7593 33.5217C10.3085 35.3502 8.43023 36.8883 6.20567 38.0584C4.36175 39.0302 2.28071 39.746 0.00935279 40.1716V64.862C2.43047 64.287 4.26815 63.2492 5.70959 61.8893C11.1914 56.7229 10.9824 46.9824 15.6593 41.0743C18.9571 37.9549 23.5653 36.1092 28.8225 36.1552C31.1938 36.1695 33.3216 36.526 35.2061 37.1528C42.3883 39.5707 46.0793 46.0308 46.2166 52.5571C46.3289 61.1217 40.2917 69.8071 28.183 69.6374C20.9258 69.7726 15.0509 75.3587 15.107 82.0689V82.0977C15.0166 88.1093 18.9166 91.8727 23.7682 93.3447C25.7213 93.9484 27.8335 94.1669 29.8958 94.003C36.0922 93.5402 41.8922 89.6963 41.9078 82.3938C41.8922 82.0948 41.8829 81.8044 41.8797 81.5169C41.5958 60.0867 72.6118 71.7534 73.4417 52.7641C73.4198 50.0069 72.4308 47.4712 70.771 45.4299C68.3935 42.506 64.6402 40.5999 60.3657 40.5194C57.0211 40.5539 54.1445 39.9272 51.7358 38.8232C45.8422 36.0919 42.7222 30.4426 42.4039 24.6523C41.9983 16.0704 47.7922 7.17805 59.6513 7.03719C59.7886 7.02856 59.9258 7.0228 60.06 7.01418C66.2282 6.7238 69.9317 8.51494 72.3996 11.3353C78.2246 18.0456 77.1295 30.5719 85.6159 34.7637C85.6752 34.7924 85.7376 34.8212 85.7969 34.8499C85.8405 34.8701 85.8842 34.893 85.931 34.9132C87.4754 35.6204 89.3287 36.0603 91.5845 36.1523C91.6063 36.1523 91.625 36.1523 91.6437 36.1523C98.7074 36.1264 104.595 30.9313 104.951 24.4769C106.532 19.9344 107.718 15.0067 110.62 11.5452C117.434 6.0108 128.815 5.99643 135.614 11.5308C138.516 14.9693 139.689 19.8597 141.236 24.3792C141.405 29.3098 144.21 32.6448 147.944 34.3928C149.713 35.4393 151.941 36.0833 154.811 36.1581C157.554 36.1207 160.097 35.3243 162.203 33.9874C165.656 32.0813 168.112 28.7003 168.031 23.8502C167.9 19.9862 166.474 17.3929 164.299 15.5328C159.029 11.0133 149.351 10.7747 142.915 7.1608C138.996 4.94705 136.282 1.46544 136.491 -5.01482C136.494 -5.12407 136.497 -5.23044 136.503 -5.33969C136.438 -16.7074 146.584 -22.216 156.156 -21.6266C159.638 -21.4023 163.045 -20.3788 165.856 -18.5532C169.974 -15.8622 172.817 -11.4174 172.761 -5.18445C172.876 -1.12782 175.041 2.44005 178.314 4.65668C180.551 6.17468 183.306 7.06018 186.276 7.04005C205.099 6.1028 195.643 -18.6797 212.887 -21.7847C214.35 -22.0463 216.007 -22.1527 217.891 -22.0779C221.916 -22.1728 225.492 -23.8461 227.907 -26.4364C229.838 -28.5122 231.023 -31.1744 231.098 -34.0983C231.098 -34.1242 231.098 -34.1501 231.098 -34.1731C231.067 -45.6644 240.926 -51.2563 250.374 -50.8136C256.08 -50.5261 261.637 -48.0449 264.766 -43.3644C266.392 -40.9178 267.362 -37.8703 267.359 -34.2162C267.359 -34.2133 267.359 -34.2076 267.359 -34.2047C267.415 -29.6478 269.677 -26.4134 272.863 -24.4929C275.137 -22.9376 277.942 -22.0319 280.959 -22.0751C283.708 -22.1153 286.254 -22.9174 288.363 -24.2629C291.789 -26.1748 294.225 -29.5529 294.16 -34.3944C294.163 -35.2598 294.076 -36.0993 293.907 -36.9101C293.87 -37.0883 293.829 -37.2637 293.782 -37.4362C292.381 -42.8354 287.237 -46.7311 280.819 -46.8259C257.275 -46.7397 257.26 -80.1731 280.491 -80.3082C280.585 -80.3139 280.675 -80.3168 280.769 -80.3197C289.065 -80.6589 292.918 -77.3354 295.286 -72.8217C297.826 -67.9543 298.662 -61.7012 301.479 -57.1702C303.532 -53.8582 306.646 -51.4604 312.262 -51.1902C312.271 -51.1902 312.281 -51.1902 312.29 -51.1902C317.472 -51.0896 321.937 -49.3013 325.141 -46.3372C327.884 -42.9217 328.982 -38.2067 330.449 -33.8367C330.888 -27.2932 336.551 -22.2246 343.721 -22.0722C343.734 -22.0722 343.743 -22.0722 343.755 -22.0722C355.037 -22.4718 358.179 -16.3136 360.438 -9.55731C362.831 -2.38994 364.244 5.44443 373.289 6.84743C373.932 6.94806 374.612 7.01704 375.333 7.04868C378.4 7.06018 381.205 6.12581 383.454 4.5388C386.633 2.29056 388.686 -1.27156 388.755 -5.35982C388.73 -7.72594 389.142 -9.83331 389.9 -11.6848C392.78 -18.6653 400.617 -21.9888 408.161 -21.6036C416.795 -21.1292 425.041 -15.7846 425.013 -5.58119C425.013 -5.57257 425.013 -5.56107 425.013 -5.54956C425.047 -0.748306 422.981 3.5498 419.584 6.6203C415.868 9.06979 410.792 10.0962 406.102 11.4589C402.112 11.7378 399.466 13.1897 397.566 15.3086C395.354 17.0709 393.838 19.5147 393.529 23.1516C392.078 27.4497 390.952 32.0871 388.309 35.4939C385.08 38.5443 380.587 40.4447 375.542 40.5309C375.533 40.5309 375.52 40.5309 375.511 40.5309C371.617 40.5942 368.257 41.9339 365.857 44.1592C363.455 46.3844 362.01 49.4952 361.948 53.0975C361.948 53.1062 361.948 53.1148 361.948 53.1263C361.861 57.7522 359.798 61.8951 356.494 64.8764C352.85 67.2857 347.905 68.3408 343.3 69.6604C338.002 69.8329 334.392 72.291 332.455 75.5973C331.247 77.2274 330.505 79.2974 330.42 81.9999C330.402 85.8869 331.984 88.8482 334.386 90.8664C336.548 92.9824 339.668 94.3797 343.74 94.4027C346.888 94.4286 349.733 93.4884 351.992 91.8526C355.125 89.8487 357.296 86.4935 357.224 81.7613C357.346 76.4195 360.095 71.7362 364.325 68.7433C371.221 64.3963 381.551 64.7097 387.885 69.7352C390.842 73.1651 392 78.064 393.526 82.5922C393.819 86.3153 395.379 88.7878 397.663 90.5559C399.591 92.6633 402.283 94.1037 406.336 94.3653C411.019 95.7022 416.061 96.7429 419.724 99.2355C422.417 102.573 423.581 107.159 425.013 111.451C425.128 116.465 427.871 119.869 431.558 121.678C433.312 122.767 435.533 123.44 438.422 123.521C442.535 123.555 445.683 122.169 447.857 120.039C450.247 118.041 451.823 115.103 451.813 111.23C451.767 108.398 451.002 106.256 449.739 104.586C447.792 101.326 444.219 98.9164 439.003 98.7727C434.423 97.4646 429.496 96.4209 425.846 94.0347C422.52 91.0677 420.417 86.942 420.286 82.3363V82.3306C420.286 82.3306 420.286 82.3133 420.286 82.3047C420.248 80.5739 419.952 79.0962 419.45 77.8225C417.74 73.1737 413.531 70.1894 407.747 69.7151C402.761 68.2661 397.329 67.1965 393.551 64.3819C387.754 58.0885 387.785 47.6293 393.604 41.3647C397.329 38.6305 402.642 37.5467 407.547 36.1293C413.556 35.7354 418.161 32.2682 419.715 27.2455C419.724 27.2139 419.734 27.1823 419.743 27.1535C419.793 26.9868 419.84 26.8143 419.883 26.6447C419.899 26.5757 419.918 26.5096 419.933 26.4406C420.111 25.6902 420.22 24.9082 420.264 24.1003C420.27 23.9565 420.276 23.8099 420.283 23.6633C420.273 19.7993 421.431 16.6282 423.337 14.1499C427.062 9.33719 433.646 7.12056 439.976 7.52594C448.512 8.10382 456.584 13.4743 456.54 23.6489C456.958 35.2265 468.845 35.3559 477.906 38.6277C477.915 38.6306 477.925 38.6334 477.934 38.6363C477.971 38.6507 478.009 38.6622 478.043 38.6765C480.208 39.47 482.212 40.4504 483.846 41.8132C483.918 41.8736 483.99 41.9339 484.062 41.9972C484.074 42.0087 484.087 42.0173 484.099 42.0288C486.645 44.2684 488.236 47.52 488.074 52.5973C488.074 52.6289 488.074 52.6606 488.074 52.6951C488.074 52.7727 488.08 52.8503 488.087 52.9279C488.57 62.8783 497.624 64.2899 505.911 66.6474C509.998 67.8147 513.898 69.2119 516.491 71.9719C518.494 74.1109 519.714 77.0722 519.63 81.3789C519.627 81.5945 519.617 81.813 519.608 82.0373C519.661 89.1385 515.802 93.9197 510.579 96.3807C507.009 98.0511 502.804 98.649 498.782 98.1689C490.748 97.1914 483.435 91.8842 483.35 82.2386V82.2213C483.35 82.2213 483.35 82.2155 483.35 82.2127C483.31 80.272 482.945 78.6506 482.321 77.2821C480.483 72.9696 476.312 70.1492 470.774 69.7122C466.041 68.358 460.905 67.3288 457.174 64.8017C453.857 60.6962 452.846 54.7075 450.834 49.7079C447.751 41.0369 441.645 39.1279 436.107 40.6833C430.654 41.4078 427.268 44.8377 425.964 48.9173C423.899 52.9193 424.027 57.5337 428.254 61.0009C430.476 63.6143 433.976 65.3738 438.759 65.2933C438.759 65.2933 438.759 65.2933 438.766 65.2933C438.772 65.2933 438.781 65.2933 438.791 65.2933C443.733 65.3709 448.175 67.2627 451.38 70.2843C454.032 73.6624 455.152 78.271 456.59 82.5577C456.89 86.3297 458.462 88.8223 460.752 90.5962C462.671 92.6863 465.348 94.1094 469.373 94.3739C473.99 95.682 478.954 96.6969 482.611 99.1205C485.924 102.099 487.993 106.259 488.077 110.922C488.077 110.931 488.077 110.94 488.077 110.951C488.423 120.148 495.843 122.155 503.399 124.179C508.432 125.533 513.527 126.893 516.628 130.369C516.628 130.369 516.628 130.372 516.631 130.375C516.7 130.452 516.769 130.533 516.837 130.613C518.675 132.804 519.755 135.811 519.608 140.115C519.608 140.127 519.608 140.138 519.608 140.147C519.608 140.173 519.611 140.196 519.611 140.222C520.035 148.803 526.628 151.057 533.676 152.966C539.111 154.45 544.814 155.724 548.175 159.507C550.14 161.729 551.304 164.823 551.139 169.331C551.139 169.334 551.139 169.34 551.139 169.342C551.139 169.351 551.139 169.363 551.139 169.371C551.554 177.47 557.56 179.94 564.224 181.831C570.036 183.496 576.345 184.715 579.886 188.809C581.761 190.988 582.853 193.987 582.688 198.294C582.682 198.423 582.679 198.549 582.669 198.682C582.626 208.557 574.991 213.902 566.739 214.698C563.188 215.032 559.522 214.532 556.296 213.201C550.683 210.863 546.412 205.973 546.409 198.524C546.409 198.518 546.409 198.512 546.409 198.506C546.68 182.421 519.474 182.418 519.605 198.391C519.605 198.406 519.605 198.42 519.605 198.435C519.57 205.067 525.183 210.435 532.456 210.855C537.276 212.235 542.471 213.304 546.159 215.943C552.109 222.196 552.184 232.776 546.34 239.113C542.615 241.876 537.276 242.965 532.347 244.4C525.055 244.869 519.745 249.952 519.605 256.745C519.605 256.757 519.605 256.768 519.605 256.777C519.605 256.788 519.605 256.8 519.605 256.814C519.558 267.072 511.452 272.466 502.913 273.006C497.493 273.328 491.899 271.71 488.09 268.168C485.219 265.477 483.357 261.679 483.344 256.768V256.751C483.222 249.957 477.95 244.849 470.739 244.397C465.819 242.957 460.471 241.867 456.712 239.153C450.831 232.88 450.774 222.403 456.609 216.116C460.343 213.382 465.688 212.283 470.624 210.852C477.822 210.409 483.291 205.188 483.344 198.593C483.344 198.567 483.344 198.541 483.347 198.512C483.347 198.486 483.347 198.463 483.344 198.437C483.31 191.788 477.906 186.598 470.699 186.155C465.963 184.787 460.836 183.735 457.117 181.205C454.4 177.781 453.277 173.071 451.807 168.719C451.626 163.854 448.89 160.548 445.227 158.797C443.461 157.742 441.23 157.092 438.341 157.012C434.173 156.991 431.003 158.426 428.841 160.614C426.538 162.592 425.025 165.458 425.013 169.213C425.087 171.841 425.777 173.882 426.9 175.509C428.791 178.971 432.429 181.578 437.833 181.754C442.744 183.191 448.048 184.295 451.76 187.004C457.763 193.464 457.517 204.346 451.158 210.547C444.822 215.817 434.285 216.205 427.312 211.703C423.103 208.638 420.389 203.848 420.286 198.371V198.363C420.286 198.363 420.286 198.36 420.286 198.357C420.305 193.883 418.186 190.663 415.132 188.706C412.904 187.107 410.108 186.152 407.041 186.132C404.043 186.112 401.282 186.978 399.045 188.467C395.819 190.376 393.529 193.628 393.485 198.225C393.485 198.239 393.485 198.253 393.485 198.268C393.485 198.268 393.485 198.271 393.485 198.274C392.147 204.173 389.978 208.342 387.348 211.119C382.534 214.713 375.676 215.693 369.717 214.1C363.982 211.619 359.078 206.522 357.396 201.028C357.29 200.266 357.231 199.475 357.224 198.65C356.987 195.194 357.596 192.57 358.787 190.525C359.961 188.798 361.683 187.188 364.051 185.785C367.595 183.927 372.029 182.964 376.16 181.739C383.239 181.294 388.643 176.081 388.755 169.46V169.455C388.836 164.679 390.855 160.479 394.143 157.472C397.809 155.013 402.817 153.973 407.469 152.644C412.714 152.521 416.311 150.031 418.252 146.673C419.462 145.011 420.208 142.892 420.286 140.118C420.308 136.372 418.829 133.508 416.554 131.528C414.405 129.317 411.232 127.868 407.029 127.896C403.89 127.876 401.035 128.814 398.764 130.421C395.61 132.402 393.419 135.702 393.482 140.334C393.382 145.848 390.543 150.675 386.184 153.7C379.111 158.035 368.569 157.446 362.344 152.044C356.744 146.276 356.204 136.737 360.791 130.3C364.057 126.261 369.283 123.624 375.236 123.535C379.62 123.601 382.911 122.069 385.111 119.74C388.34 116.327 389.211 111.198 387.729 106.872C386.19 102.364 382.1 98.7238 375.461 98.7842H375.417C368.154 98.7698 362.463 103.838 361.982 110.6C360.516 114.95 359.365 119.637 356.638 123.038C352.947 125.542 347.867 126.58 343.163 127.931C335.868 128.385 330.542 133.511 330.42 140.342C330.336 145.092 328.265 149.292 324.917 152.288C321.232 154.712 316.228 155.718 311.591 157.043C304.387 157.477 299.018 162.635 298.887 169.386C298.887 169.432 298.887 169.478 298.893 169.524C299.03 173.068 298.316 175.731 297.021 177.783C294.438 181.852 289.539 183.531 284.457 184.951C279.187 186.411 273.718 187.596 270.423 190.905C268.707 192.618 267.581 194.898 267.381 198.084C267.375 198.199 267.365 198.314 267.359 198.432C267.359 198.446 267.359 198.46 267.359 198.475C267.353 205.061 272.984 210.472 280.151 210.86C284.862 212.206 289.938 213.235 293.62 215.748C296.319 219.143 297.439 223.818 298.896 228.159C299.071 233.024 301.782 236.347 305.417 238.13C307.198 239.225 309.457 239.904 312.399 239.998C315.126 239.898 317.26 239.268 318.97 238.262C322.698 236.525 325.5 233.193 325.678 228.26C327.163 223.93 328.302 219.252 330.935 215.837C334.193 212.758 338.72 210.889 343.821 210.88C343.83 210.88 343.84 210.88 343.849 210.88C344.935 210.823 345.942 210.834 346.885 210.903C357.608 211.697 359.299 220.267 361.883 227.903C363.951 234.033 366.584 239.561 374.912 239.975C375.093 239.984 375.28 239.993 375.467 239.998C375.489 239.998 375.508 239.998 375.529 239.996C382.612 239.912 388.253 234.852 388.721 228.289C390.262 223.769 391.426 218.867 394.337 215.414C401.22 209.903 412.835 209.914 419.624 215.498C425.98 221.679 426.189 232.613 420.214 239.101C416.483 241.838 411.144 242.94 406.218 244.383C399.064 244.765 393.497 250.084 393.479 256.682C393.435 259.298 394.134 261.492 395.329 263.263C397.519 266.529 401.382 268.343 405.422 268.7C412.576 269.358 420.289 265.465 420.28 256.86C420.28 256.834 420.28 256.811 420.28 256.786C420.373 251.165 423.209 246.3 427.608 243.276C434.616 239.024 445.012 239.51 451.246 244.708C457.56 250.929 457.679 261.851 451.623 268.3C447.888 270.997 442.594 272.078 437.708 273.507C430.572 273.932 425.069 279.167 425.006 285.737V285.743C425.343 292.953 429.995 295.736 435.63 297.576C443.19 300.063 452.519 300.845 455.561 308.277C456.234 309.93 456.599 311.911 456.568 314.311C456.565 314.61 456.556 314.918 456.537 315.231C456.568 318.198 457.545 320.608 459.108 322.459C459.136 322.491 459.161 322.522 459.189 322.554C459.214 322.586 459.242 322.617 459.267 322.646C461.657 325.374 465.332 326.821 469.092 327.002C476.059 327.375 483.332 323.451 483.338 315.194C483.338 315.182 483.338 315.171 483.338 315.157C483.428 310.246 485.435 306.017 488.764 303.013C492.486 300.557 497.574 299.548 502.273 298.191C506.186 297.884 508.816 296.472 510.716 294.416C512.937 292.677 514.472 290.262 514.825 286.657C516.382 282.117 517.511 277.172 520.394 273.688C527.168 268.116 538.587 268.056 545.435 273.541C548.561 277.235 549.744 282.632 551.51 287.436C554.436 297.222 560.748 299.577 566.514 298.142C572.096 297.565 575.565 294.126 576.929 289.989C579.047 285.993 578.988 281.35 574.835 277.831C572.688 275.197 569.291 273.415 564.639 273.475C564.639 273.475 564.639 273.475 564.636 273.475C561.307 273.492 558.449 272.848 556.059 271.727C549.728 268.725 546.661 262.308 546.874 256.024C547.204 247.974 552.951 240.148 564.021 239.998C564.136 239.998 564.252 239.998 564.367 239.998C567.902 239.8 570.635 240.289 572.801 241.26C580.183 244.607 580.885 253.692 583.952 260.589C585.945 265.109 588.95 268.685 595.533 269.085C595.733 269.096 595.932 269.108 596.138 269.113C602.069 269.203 607.23 271.73 610.493 275.657C615.233 282.042 614.755 291.628 609.174 297.475C605.455 300.132 600.222 301.213 595.383 302.625C588.189 303.062 582.682 308.314 582.657 314.898C582.657 314.918 582.657 314.938 582.654 314.958C582.654 314.976 582.654 314.993 582.657 315.01C582.694 321.588 588.257 326.89 595.433 327.321C600.307 328.724 605.573 329.779 609.286 332.461C615.27 338.758 615.192 349.389 609.18 355.697C605.473 358.348 600.26 359.437 595.433 360.846C590.098 361.056 586.469 363.618 584.563 367.022C583.449 368.62 582.757 370.624 582.654 373.2C582.66 376.032 583.69 378.625 585.434 380.701C587.577 383.544 591.121 385.54 596.082 385.58C596.107 385.58 596.132 385.58 596.157 385.58H596.163C602.562 386.919 607.049 389.012 610.007 391.519C613.726 396.105 614.643 402.577 612.765 408.094C609.982 413.211 604.547 417.512 598.706 418.953C597.873 419.039 597.009 419.076 596.107 419.065C592.348 419.197 589.499 418.596 587.284 417.487C585.168 416.224 583.218 414.31 581.571 411.627C579.939 408.554 579.028 404.917 577.88 401.51C577.578 397.908 576.049 395.499 573.812 393.762C571.921 391.718 569.284 390.306 565.338 389.996C560.399 388.564 555.029 387.483 551.267 384.72C545.298 378.386 545.37 367.786 551.429 361.528C555.176 358.903 560.446 357.836 565.303 356.427C572.539 355.947 577.986 350.62 577.924 343.915V343.901C577.952 339.933 576.267 336.952 573.731 334.965C571.397 333.114 568.339 332.134 565.235 332.019C558.224 331.711 550.955 335.73 551.123 344.163V344.183C551.061 354.642 542.577 360.047 533.832 360.378C527.879 360.567 521.804 358.428 518.185 353.989C516.126 351.439 514.862 348.13 514.859 344.056C514.859 344.056 514.859 344.056 514.859 344.053C514.925 339.577 512.847 336.345 509.824 334.365C507.543 332.688 504.638 331.705 501.425 331.711C497.184 331.656 493.983 333.097 491.815 335.307C489.503 337.306 488.005 340.209 488.055 344.022C488.043 346.859 489.069 349.467 490.813 351.557C492.954 354.466 496.514 356.499 501.484 356.465H501.49C507.948 356.436 512.622 358.917 515.527 362.542C518.126 365.814 519.315 370.017 519.096 374.143C518.631 382.187 512.756 389.941 501.574 389.947C501.443 389.953 501.312 389.956 501.184 389.958C496.688 390.07 493.515 389.107 491.182 387.471C485.927 383.757 484.948 376.578 482.633 370.604C480.63 365.389 477.613 361.093 469.825 360.829C469.819 360.829 469.81 360.829 469.803 360.829C469.797 360.829 469.794 360.829 469.788 360.829C465.13 360.944 461.875 359.938 459.504 358.236C454.506 354.628 453.426 347.897 451.32 342.116C449.342 336.633 446.447 332.004 438.394 331.714C438.379 331.714 438.366 331.714 438.351 331.714C433.212 331.636 428.644 329.695 425.384 326.582C422.747 323.149 421.668 318.492 420.214 314.191C419.911 310.554 418.364 308.127 416.099 306.385C414.208 304.355 411.575 302.958 407.647 302.648C402.895 301.27 397.744 300.218 394.015 297.668C391.273 294.23 390.162 289.494 388.686 285.124C388.147 278.446 382.777 273.673 375.461 273.486C375.405 273.486 375.345 273.481 375.289 273.478C374.924 273.489 374.568 273.495 374.222 273.495C374.216 273.495 374.207 273.495 374.2 273.495C374.185 273.495 374.172 273.495 374.157 273.495C371.165 273.475 368.79 272.946 366.875 272.043C361.199 269.364 359.539 263.389 357.705 257.674C355.571 250.99 353.203 244.656 343.84 244.36C343.818 244.36 343.799 244.36 343.78 244.36C341.25 244.449 339.231 244.978 337.587 245.838C333.182 248.129 331.491 252.752 329.952 257.573C328.461 262.208 327.107 267.026 323.65 270.134C321.238 272.285 317.797 273.613 312.568 273.486C312.452 273.484 312.34 273.481 312.225 273.475C308.496 273.527 305.195 274.881 302.805 277.086C300.415 279.288 298.94 282.341 298.868 285.797C298.887 286.203 298.896 286.596 298.893 286.982C298.871 290.334 298.035 292.844 296.64 294.773C295.267 296.673 293.352 298.019 291.155 299.06C284.606 302.159 275.537 302.564 270.688 307.107C268.769 308.892 267.512 311.321 267.337 314.809C267.337 314.82 267.337 314.832 267.337 314.843C267.272 321.456 272.922 326.933 280.11 327.327C284.797 328.649 289.848 329.65 293.533 332.139C296.269 335.546 297.401 340.264 298.88 344.643C299.055 349.691 301.916 353.055 305.71 354.774C307.464 355.778 309.66 356.393 312.48 356.468C316.574 356.447 319.691 355.018 321.831 352.857C324.19 350.855 325.725 347.943 325.675 344.14C325.684 341.267 324.673 338.645 322.948 336.552C320.851 333.706 317.37 331.719 312.499 331.714C312.493 331.714 312.487 331.714 312.484 331.714H312.468C306.396 331.613 301.117 329.02 297.804 325.009C293.121 318.552 293.608 308.941 299.233 303.159C305.969 297.294 317.813 297.122 324.801 302.702C327.712 306.149 328.882 311.06 330.433 315.594C330.885 322.114 336.455 327.12 343.587 327.338C343.652 327.338 343.718 327.344 343.783 327.347C343.793 327.347 343.802 327.347 343.811 327.347C348.997 327.447 353.508 329.279 356.731 332.28C359.418 335.69 360.528 340.365 361.982 344.7C362.313 348.389 363.851 350.85 366.082 352.612C367.985 354.699 370.643 356.134 374.64 356.424C379.358 357.767 384.453 358.77 388.153 361.272C390.87 364.644 392.019 369.302 393.469 373.637C393.61 378.389 396.181 381.696 399.681 383.536C401.482 384.74 403.793 385.491 406.854 385.583C409.824 385.591 412.551 384.717 414.757 383.219C418.008 381.273 420.295 377.932 420.264 373.177V373.171C420.264 373.171 420.264 373.163 420.264 373.157C420.358 367.855 422.95 363.209 427.006 360.173C433.861 355.568 444.363 355.74 450.818 360.812C453.81 364.253 454.999 369.215 456.565 373.795C456.88 377.628 458.506 380.132 460.871 381.903C462.783 383.924 465.42 385.295 469.32 385.548C474.128 386.902 479.319 387.923 483.017 390.551C489.047 396.798 489.157 407.479 483.26 413.844C479.5 416.696 474.096 417.731 469.123 419.16C463.364 419.723 459.489 422.279 457.62 426.724C457.576 426.819 457.535 426.914 457.492 427.011H483.653C484.308 423.998 485.759 421.865 487.703 420.278C491.506 417.173 497.172 416.15 502.351 414.666C505.443 413.781 508.36 412.731 510.6 410.975C512.822 409.235 514.382 406.803 514.784 403.152C514.816 402.882 514.841 402.603 514.856 402.315C514.931 397.761 516.831 393.702 519.914 390.72C523.23 387.515 527.913 385.557 533.167 385.58C533.192 385.58 533.217 385.58 533.242 385.58C540.209 385.56 545.086 388.561 547.872 392.779C549.217 394.814 550.075 397.129 550.446 399.523C551.878 408.767 546.065 419.177 533.002 419.062C532.993 419.062 532.983 419.062 532.974 419.062C527.333 420.799 524.222 422.397 522.475 423.829C521.726 424.766 521.105 425.836 520.622 427.008H546.961C548.012 423.182 550.302 420.284 553.241 418.303C559.606 414.013 569.007 414.002 575.447 418.05C578.629 420.051 581.084 423.047 582.095 427.008H610.278C612.331 420.589 617.47 416.049 623.981 414.982V389.622C619.557 388.808 616.181 386.787 613.838 384.119C611.988 382.012 610.777 379.502 610.2 376.866C608.344 368.384 613.043 358.612 623.981 356.807V331.383C620.387 330.722 617.482 329.267 615.261 327.309C615.217 327.269 615.173 327.229 615.127 327.189C615.077 327.143 615.027 327.096 614.974 327.051C612.497 324.756 610.915 321.83 610.216 318.722C608.303 310.217 612.996 300.382 623.975 298.568V273.09C623.916 273.049 623.853 273.009 623.794 272.972C621.295 272.434 619.111 271.595 617.251 270.465C615.601 269.461 614.203 268.225 613.064 266.765C610.88 263.959 609.651 260.325 609.426 255.897C609.139 253.117 608.147 251.036 606.681 249.423C604.185 246.674 600.313 245.288 596.207 244.113C590.738 242.549 584.86 241.364 581.275 237.842C578.994 235.603 577.643 232.42 577.914 227.59C577.914 223.896 579.097 220.595 581.209 217.921C584.454 213.807 589.886 211.174 596.556 210.869C605.127 210.351 607.664 204.475 609.757 198.138C612.141 190.919 613.941 183.102 623.417 181.921C623.594 181.898 623.788 181.889 623.972 181.872V157.451C618.493 158.808 614.334 163.535 614.175 169.179C614.175 169.225 614.175 169.273 614.175 169.319C614.172 180.161 605.321 185.586 596.363 185.695C593.299 185.733 590.223 185.149 587.483 183.947C582.136 181.599 578.077 176.889 577.921 169.854C577.921 169.731 577.914 169.61 577.914 169.486C577.905 169.342 577.896 169.199 577.889 169.058C577.69 164.846 578.782 161.905 580.669 159.751C584.339 155.563 591.006 154.349 597.003 152.561C597.015 152.558 597.031 152.552 597.043 152.55C597.068 152.541 597.093 152.535 597.118 152.527C598.694 152.055 600.219 151.538 601.633 150.919C601.664 150.905 601.698 150.891 601.729 150.876C601.798 150.845 601.867 150.816 601.935 150.784C606.154 148.861 609.274 145.923 609.448 140.181C609.448 140.173 609.448 140.167 609.448 140.158C608.987 127.796 594.697 128.667 585.505 124.251C580.86 122.02 577.518 118.438 577.918 111.118C577.918 111.106 577.918 111.098 577.918 111.086C577.602 104.991 579.883 101.495 583.346 99.2125C587.009 96.7975 591.995 95.7395 596.628 94.3998C601.074 93.1118 605.199 91.5622 607.517 88.299C608.674 86.666 609.383 84.6076 609.451 81.9338C609.483 77.9922 607.86 75.0252 605.399 73.027C601.102 69.5397 594.254 69.0222 589.19 71.4832C585.521 73.2657 582.791 76.615 582.651 81.5342C582.644 81.744 582.641 81.9597 582.647 82.1753C582.569 86.7667 580.579 90.8664 577.365 93.842C574.139 96.832 569.674 98.6893 564.676 98.7698C564.67 98.7698 564.661 98.7698 564.654 98.7698C564.486 98.7698 564.321 98.7813 564.155 98.787C556.954 99.1033 551.694 103.873 551.164 110.497C551.142 110.782 551.123 111.069 551.117 111.359C551.117 116.799 548.814 120.847 545.363 123.521C538.443 128.885 526.918 128.713 520.188 123.112C516.922 120.393 514.784 116.396 514.856 111.129C514.6 105.397 516.557 101.955 519.608 99.6668C523.349 96.8608 528.728 95.7884 533.688 94.3595C539.152 92.784 544.103 90.7744 545.788 85.539C545.897 85.1969 545.994 84.8376 546.075 84.4667C546.078 84.4494 546.081 84.435 546.084 84.4178C546.122 84.2367 546.159 84.0527 546.19 83.8629C546.203 83.7939 546.212 83.7249 546.221 83.6559C546.237 83.5611 546.25 83.4662 546.262 83.3713C546.29 83.1499 546.315 82.9285 546.337 82.6985C546.337 82.6928 546.337 82.6842 546.337 82.6784C546.346 82.5519 546.356 82.4226 546.362 82.2932C546.368 82.1667 546.374 82.0402 546.381 81.9108C546.381 81.8763 546.384 81.8418 546.384 81.8044C546.384 81.8044 546.384 81.8015 546.384 81.7987C546.484 77.1498 548.568 72.9983 551.891 70.0169C555.098 67.1419 559.46 65.3594 564.311 65.2904C564.595 65.2847 564.879 65.2732 565.157 65.2559C570.688 64.9052 575.035 61.9382 576.91 57.5423C577.35 56.5102 577.656 55.4004 577.805 54.2274C577.827 54.0636 577.843 53.8997 577.858 53.7358C577.861 53.6955 577.868 53.6553 577.871 53.6122C577.88 53.4914 577.889 53.3678 577.896 53.2442C577.905 53.0947 577.911 52.9452 577.914 52.7957C577.914 52.7842 577.914 52.7727 577.914 52.7612V52.7267C577.911 47.1923 580.326 43.0782 583.914 40.3901C587.331 37.8284 591.808 36.5605 596.269 36.5922C605.283 36.6554 614.225 42.0259 614.175 52.7525C614.175 52.7612 614.175 52.7698 614.175 52.7813C614.228 55.8662 615.248 58.514 617.08 60.584C618.743 62.4643 621.08 63.8615 623.975 64.6809V40.1284C623.941 40.1054 623.906 40.0824 623.872 40.0594C621.354 39.5247 619.151 38.6852 617.279 37.5524C615.526 36.4915 614.057 35.1748 612.883 33.6022C610.812 30.8307 609.648 27.2743 609.426 22.9675C608.69 15.0441 602.266 12.9252 595.411 11.0938C587.028 8.8513 577.999 7.03717 577.939 -4.4657C577.849 -8.7207 579.003 -12.1793 580.953 -14.8531C584.345 -19.5048 590.145 -21.7761 595.979 -21.7301C602.182 -21.6812 608.419 -19.0161 611.851 -13.8037C613.698 -11.0006 614.73 -7.46144 614.509 -3.19781C614.503 -3.08281 614.496 -2.96783 614.49 -2.85283C615.03 -0.121582 616.45 2.1353 618.59 3.82005C620.059 4.97868 621.872 5.86131 623.972 6.44781V-18.0127C619.317 -18.8694 615.826 -21.0631 613.47 -23.9409C608.7 -29.7686 608.603 -38.3936 612.993 -44.3621C615.358 -47.5763 619.03 -50.0143 623.972 -50.8308V-76.2602C620.933 -76.8208 618.381 -77.9449 616.328 -79.4629C614.843 -80.5612 613.61 -81.8636 612.634 -83.3011C611.32 -85.2331 610.465 -87.4037 610.063 -89.6519C609.264 -94.1197 610.253 -98.8778 612.993 -102.598C615.358 -105.812 619.03 -108.25 623.972 -109.067L624 -109.087ZM139.189 -27.1926C139.174 -27.1609 139.158 -27.1293 139.143 -27.0948C139.102 -27.0057 139.061 -26.9194 139.021 -26.8332C138.987 -26.7613 138.949 -26.6923 138.915 -26.6204C138.89 -26.5716 138.868 -26.5256 138.843 -26.4796C138.787 -26.3703 138.731 -26.2611 138.671 -26.1547C138.668 -26.1461 138.662 -26.1374 138.659 -26.1288C137.149 -23.3401 134.815 -20.9653 131.664 -19.4559C131.658 -19.4559 131.655 -19.4502 131.648 -19.4502C131.53 -19.3927 131.408 -19.3381 131.286 -19.2834C131.274 -19.2777 131.262 -19.2719 131.249 -19.2662C131.14 -19.2173 131.027 -19.1685 130.915 -19.1225C130.89 -19.1109 130.865 -19.0994 130.84 -19.0908C130.737 -19.0477 130.631 -19.0074 130.525 -18.9672C130.491 -18.9528 130.457 -18.9384 130.422 -18.9269C130.332 -18.8924 130.241 -18.8608 130.151 -18.8263C130.101 -18.8091 130.048 -18.7889 129.998 -18.7717C129.92 -18.743 129.839 -18.7171 129.761 -18.6912C129.695 -18.6682 129.63 -18.6452 129.564 -18.6251C129.486 -18.5992 129.408 -18.5762 129.327 -18.5532C129.258 -18.5331 129.19 -18.5101 129.121 -18.4899C129.04 -18.4669 128.959 -18.4439 128.878 -18.4209C128.809 -18.4008 128.741 -18.3807 128.672 -18.3634C128.594 -18.3433 128.513 -18.3232 128.432 -18.3031C128.357 -18.2829 128.285 -18.2657 128.21 -18.2484C128.132 -18.2312 128.051 -18.2139 127.97 -18.1938C127.895 -18.1766 127.817 -18.1593 127.742 -18.1421C127.667 -18.1277 127.592 -18.1133 127.518 -18.099C127.433 -18.0817 127.352 -18.0644 127.265 -18.0501C127.193 -18.0357 127.118 -18.0242 127.043 -18.0127C126.956 -17.9983 126.869 -17.9811 126.781 -17.9667C126.694 -17.9523 126.603 -17.9408 126.516 -17.9293C126.438 -17.9178 126.363 -17.9063 126.288 -17.8948C126.179 -17.8804 126.067 -17.8689 125.958 -17.8546C125.901 -17.8488 125.845 -17.8402 125.786 -17.8344C125.664 -17.8201 125.543 -17.8114 125.418 -17.7999C125.371 -17.7942 125.324 -17.7913 125.274 -17.7856C125.143 -17.7741 125.009 -17.7654 124.875 -17.7568C124.834 -17.754 124.794 -17.7511 124.753 -17.7482C124.603 -17.7396 124.454 -17.7338 124.301 -17.7281C124.276 -17.7281 124.251 -17.7281 124.226 -17.7252C124.051 -17.7194 123.873 -17.7166 123.696 -17.7137H123.689C123.508 -17.7137 123.324 -17.7137 123.14 -17.7137H123.09C122.925 -17.7137 122.759 -17.7137 122.594 -17.7137C122.547 -17.7137 122.504 -17.7137 122.457 -17.7166C122.323 -17.7166 122.189 -17.7194 122.058 -17.7252C121.998 -17.7252 121.939 -17.7309 121.883 -17.7338C121.764 -17.7396 121.646 -17.7424 121.53 -17.7511C121.474 -17.7539 121.418 -17.7597 121.362 -17.7626C121.243 -17.7712 121.128 -17.7769 121.009 -17.7884C120.944 -17.7942 120.881 -17.7999 120.819 -17.8057C120.713 -17.8143 120.604 -17.8229 120.501 -17.8344C120.435 -17.8402 120.37 -17.8488 120.304 -17.8574C120.201 -17.8689 120.098 -17.8804 119.995 -17.8948C119.923 -17.9034 119.855 -17.9149 119.786 -17.9236C119.693 -17.9379 119.596 -17.9494 119.502 -17.9638C119.43 -17.9753 119.359 -17.9868 119.287 -17.9983C119.196 -18.0127 119.106 -18.0271 119.016 -18.0443C118.947 -18.0558 118.881 -18.0702 118.813 -18.0846C118.722 -18.1018 118.629 -18.1191 118.538 -18.1392C118.476 -18.1536 118.416 -18.1679 118.354 -18.1794C118.26 -18.1996 118.164 -18.2197 118.07 -18.2427C118.023 -18.2542 117.973 -18.2657 117.927 -18.2772C117.821 -18.3031 117.714 -18.3289 117.608 -18.3548C117.568 -18.3663 117.527 -18.3778 117.487 -18.3893C117.378 -18.4181 117.265 -18.4497 117.156 -18.4813C117.125 -18.4899 117.094 -18.5014 117.059 -18.5101C116.941 -18.5446 116.825 -18.5791 116.71 -18.6164C116.685 -18.6251 116.66 -18.6337 116.632 -18.6423C116.513 -18.6797 116.392 -18.7199 116.273 -18.7602C116.254 -18.7659 116.232 -18.7746 116.214 -18.7832C111.796 -20.3386 108.732 -23.4493 107.038 -27.1552C107.025 -27.1839 107.01 -27.2156 106.997 -27.2443C106.957 -27.3335 106.916 -27.4254 106.876 -27.5146C106.835 -27.6094 106.794 -27.7072 106.754 -27.8049C106.745 -27.8308 106.732 -27.8538 106.723 -27.8797C102.732 -37.7927 108.142 -51.3627 123.071 -51.1959C138.353 -51.4547 143.701 -37.1803 139.18 -27.1897L139.189 -27.1926ZM226.631 -106.991C226.631 -106.991 226.621 -106.985 226.618 -106.982C226.503 -106.925 226.387 -106.867 226.272 -106.813C226.256 -106.807 226.244 -106.798 226.228 -106.79C226.119 -106.738 226.007 -106.689 225.897 -106.637C225.876 -106.629 225.854 -106.617 225.829 -106.606C225.723 -106.557 225.613 -106.511 225.504 -106.468C225.476 -106.456 225.451 -106.445 225.423 -106.433C225.326 -106.393 225.23 -106.356 225.13 -106.318C225.089 -106.301 225.049 -106.284 225.005 -106.269C224.915 -106.235 224.824 -106.203 224.73 -106.169C224.681 -106.152 224.631 -106.131 224.578 -106.114C224.493 -106.085 224.406 -106.057 224.322 -106.028C224.262 -106.008 224.206 -105.988 224.147 -105.97C224.072 -105.945 223.994 -105.924 223.919 -105.901C223.848 -105.878 223.779 -105.855 223.704 -105.835C223.635 -105.815 223.564 -105.795 223.495 -105.778C223.414 -105.755 223.336 -105.732 223.255 -105.712C223.186 -105.694 223.117 -105.677 223.049 -105.66C222.965 -105.637 222.88 -105.617 222.793 -105.597C222.724 -105.579 222.656 -105.565 222.59 -105.551C222.503 -105.531 222.415 -105.51 222.325 -105.493C222.256 -105.479 222.185 -105.464 222.113 -105.453C222.025 -105.436 221.938 -105.418 221.848 -105.401C221.779 -105.39 221.71 -105.378 221.642 -105.367C221.548 -105.349 221.454 -105.332 221.361 -105.318C221.289 -105.306 221.217 -105.298 221.146 -105.286C221.052 -105.272 220.962 -105.257 220.868 -105.246C220.774 -105.234 220.678 -105.223 220.581 -105.211C220.509 -105.203 220.437 -105.194 220.366 -105.186C220.259 -105.174 220.15 -105.165 220.041 -105.157C219.979 -105.151 219.919 -105.145 219.857 -105.14C219.738 -105.131 219.617 -105.122 219.498 -105.114C219.445 -105.111 219.392 -105.105 219.339 -105.102C219.202 -105.094 219.065 -105.088 218.927 -105.085C218.89 -105.085 218.849 -105.079 218.812 -105.079C218.65 -105.073 218.487 -105.071 218.322 -105.068C218.306 -105.068 218.291 -105.068 218.275 -105.068C218.094 -105.068 217.91 -105.068 217.726 -105.068H217.714C217.536 -105.068 217.358 -105.068 217.183 -105.068C217.149 -105.068 217.115 -105.068 217.08 -105.071C216.934 -105.071 216.79 -105.076 216.647 -105.079C216.59 -105.079 216.534 -105.085 216.478 -105.088C216.356 -105.094 216.238 -105.096 216.116 -105.105C216.054 -105.108 215.994 -105.114 215.932 -105.119C215.82 -105.125 215.707 -105.134 215.595 -105.142C215.542 -105.148 215.489 -105.151 215.436 -105.157C215.317 -105.168 215.199 -105.177 215.083 -105.191C215.03 -105.197 214.977 -105.203 214.921 -105.211C214.806 -105.226 214.693 -105.237 214.581 -105.252C214.522 -105.26 214.466 -105.269 214.41 -105.278C214.303 -105.292 214.194 -105.306 214.088 -105.324C214.026 -105.332 213.966 -105.344 213.907 -105.355C213.807 -105.372 213.704 -105.39 213.605 -105.407C213.548 -105.418 213.495 -105.43 213.439 -105.439C213.336 -105.459 213.23 -105.479 213.127 -105.499C213.074 -105.51 213.024 -105.522 212.974 -105.533C212.868 -105.556 212.762 -105.579 212.659 -105.602C212.622 -105.611 212.587 -105.62 212.55 -105.628C212.431 -105.657 212.313 -105.686 212.197 -105.717C212.166 -105.726 212.135 -105.735 212.104 -105.743C211.985 -105.775 211.864 -105.809 211.745 -105.844C211.72 -105.853 211.692 -105.861 211.667 -105.867C211.545 -105.901 211.424 -105.939 211.302 -105.979C211.286 -105.985 211.274 -105.988 211.258 -105.993C211.127 -106.037 210.996 -106.08 210.868 -106.126C210.856 -106.131 210.843 -106.134 210.828 -106.14C206.4 -107.701 203.337 -110.821 201.642 -114.532C201.624 -114.578 201.602 -114.624 201.583 -114.67C201.549 -114.745 201.515 -114.82 201.483 -114.894C201.44 -115.001 201.396 -115.107 201.352 -115.214C201.346 -115.231 201.34 -115.245 201.334 -115.26C197.359 -125.178 202.788 -138.737 217.72 -138.556C232.995 -138.797 238.324 -124.517 233.791 -114.529C233.785 -114.515 233.778 -114.501 233.769 -114.486C233.722 -114.383 233.672 -114.276 233.622 -114.173C233.591 -114.107 233.557 -114.041 233.526 -113.974C233.501 -113.923 233.476 -113.871 233.448 -113.816C233.388 -113.698 233.326 -113.583 233.264 -113.466C231.813 -110.795 229.607 -108.506 226.649 -106.994L226.631 -106.991ZM242.106 -77.5827C242.087 -77.5884 242.068 -77.5942 242.05 -77.6028C241.937 -77.6431 241.822 -77.6833 241.71 -77.7236C241.66 -77.7408 241.61 -77.7609 241.56 -77.7811C241.479 -77.8127 241.398 -77.8414 241.316 -77.8731C241.207 -77.9162 241.095 -77.9622 240.986 -78.0053C240.967 -78.0139 240.948 -78.0197 240.929 -78.0283C237.207 -79.5722 234.081 -82.2229 232.406 -85.9777C232.403 -85.9863 232.396 -85.9949 232.393 -86.0064C232.34 -86.1272 232.287 -86.2508 232.237 -86.3744C232.234 -86.3831 232.231 -86.3917 232.225 -86.4003C232.181 -86.5096 232.137 -86.6217 232.094 -86.7338C232.084 -86.7568 232.075 -86.7798 232.066 -86.8028C232.028 -86.9034 231.994 -87.0041 231.956 -87.1047C231.944 -87.1392 231.931 -87.1766 231.919 -87.2111C231.888 -87.3088 231.857 -87.4066 231.825 -87.5043C231.813 -87.5474 231.797 -87.5877 231.785 -87.6279C231.757 -87.7228 231.729 -87.8206 231.701 -87.9154C231.688 -87.9614 231.672 -88.0074 231.66 -88.0534C231.638 -88.1397 231.616 -88.2259 231.594 -88.3093C231.579 -88.3668 231.563 -88.4272 231.548 -88.4847C231.526 -88.5681 231.51 -88.6486 231.492 -88.7319C231.476 -88.7981 231.46 -88.8613 231.448 -88.9246C231.429 -89.0051 231.417 -89.0884 231.398 -89.1689C231.385 -89.2379 231.37 -89.3041 231.357 -89.3731C231.342 -89.4564 231.329 -89.5427 231.314 -89.6289C231.301 -89.6979 231.292 -89.7641 231.279 -89.8302C231.267 -89.9222 231.254 -90.0142 231.242 -90.1062C231.233 -90.1694 231.223 -90.2298 231.217 -90.2931C231.208 -90.3764 231.198 -90.4627 231.189 -90.5461C231.179 -90.6179 231.173 -90.6927 231.164 -90.7646C231.155 -90.8594 231.148 -90.9572 231.142 -91.0549C231.136 -91.1182 231.13 -91.1814 231.126 -91.2447C231.12 -91.3482 231.114 -91.4546 231.111 -91.5609C231.111 -91.6184 231.105 -91.6759 231.102 -91.7334C231.095 -91.8714 231.092 -92.0094 231.092 -92.1503C231.092 -92.1762 231.092 -92.2021 231.092 -92.2308C231.092 -92.3803 231.092 -92.5327 231.092 -92.6851C231.092 -92.7023 231.092 -92.7196 231.092 -92.7368C231.086 -93.0761 231.092 -93.4067 231.105 -93.7344C231.105 -93.7546 231.105 -93.7747 231.105 -93.7919C231.111 -93.9357 231.117 -94.0794 231.126 -94.2203C231.126 -94.2548 231.133 -94.2922 231.136 -94.3267C231.145 -94.4532 231.155 -94.5768 231.167 -94.7004C231.17 -94.7436 231.176 -94.7867 231.18 -94.8298C231.192 -94.9448 231.201 -95.0598 231.217 -95.1719C231.223 -95.2237 231.233 -95.2754 231.239 -95.3272C231.254 -95.4307 231.267 -95.5342 231.282 -95.6348C231.292 -95.6981 231.304 -95.7584 231.314 -95.8217C231.329 -95.9108 231.342 -96.0028 231.36 -96.0919C231.373 -96.1638 231.389 -96.2328 231.401 -96.3047C231.417 -96.3823 231.432 -96.4628 231.448 -96.5376C231.463 -96.6181 231.482 -96.6957 231.501 -96.7733C231.516 -96.8423 231.532 -96.9113 231.548 -96.9774C231.566 -97.0493 231.585 -97.1212 231.604 -97.1931C231.623 -97.2649 231.641 -97.3368 231.66 -97.4087C231.679 -97.4777 231.701 -97.5496 231.722 -97.6186C231.744 -97.6904 231.763 -97.7623 231.785 -97.8313C231.803 -97.8974 231.825 -97.9578 231.847 -98.0239C231.872 -98.0987 231.894 -98.1734 231.919 -98.2482C231.938 -98.3028 231.956 -98.3546 231.975 -98.4092C232.003 -98.4926 232.034 -98.5731 232.062 -98.6564C232.078 -98.7024 232.097 -98.7456 232.115 -98.7887C232.15 -98.8778 232.184 -98.9669 232.222 -99.0561C232.237 -99.0963 232.256 -99.1366 232.275 -99.1768C232.312 -99.2688 232.35 -99.3579 232.39 -99.4471C232.406 -99.4873 232.424 -99.5247 232.443 -99.5621C232.484 -99.6512 232.524 -99.7432 232.568 -99.8323C232.583 -99.8668 232.602 -99.9013 232.621 -99.9358C232.665 -100.028 232.711 -100.117 232.758 -100.209C232.771 -100.232 232.783 -100.252 232.793 -100.275C232.846 -100.376 232.899 -100.479 232.955 -100.577C232.955 -100.58 232.958 -100.583 232.958 -100.586C233.092 -100.827 233.232 -101.06 233.379 -101.29C233.379 -101.293 233.385 -101.299 233.385 -101.301C235.023 -103.854 237.413 -105.772 240.181 -107.051C240.212 -107.066 240.243 -107.08 240.274 -107.095C240.368 -107.138 240.465 -107.181 240.561 -107.224C240.617 -107.25 240.674 -107.273 240.73 -107.296C240.802 -107.327 240.873 -107.356 240.945 -107.385C241.029 -107.419 241.114 -107.451 241.198 -107.486C241.245 -107.503 241.288 -107.523 241.335 -107.54C252.155 -111.718 267.615 -106.787 267.34 -92.6764C267.521 -78.8908 252.832 -73.8883 242.096 -77.5712L242.106 -77.5827ZM367.892 -19.4617C367.82 -19.4876 367.748 -19.5163 367.676 -19.5422C367.617 -19.5652 367.558 -19.5853 367.499 -19.6083C367.38 -19.6543 367.261 -19.7032 367.143 -19.7521C367.134 -19.7549 367.121 -19.7607 367.112 -19.7636C363.127 -21.4052 359.814 -24.3147 358.226 -28.4892C358.226 -28.4949 358.223 -28.5007 358.22 -28.5064C358.173 -28.6272 358.129 -28.7508 358.085 -28.8744C358.079 -28.8888 358.076 -28.9003 358.07 -28.9147C358.032 -29.0268 357.995 -29.1389 357.958 -29.2539C357.948 -29.2798 357.939 -29.3057 357.933 -29.3344C357.898 -29.4466 357.864 -29.5587 357.833 -29.6737C357.823 -29.7024 357.817 -29.7312 357.808 -29.7599C357.777 -29.8749 357.745 -29.9899 357.717 -30.1049C357.711 -30.1337 357.702 -30.1624 357.695 -30.1912C357.671 -30.2976 357.646 -30.4039 357.621 -30.5132C357.611 -30.5534 357.602 -30.5908 357.593 -30.6311C357.568 -30.7432 357.546 -30.8553 357.524 -30.9674C357.518 -31.0048 357.508 -31.0422 357.502 -31.0796C357.48 -31.1888 357.465 -31.3009 357.446 -31.4102C357.44 -31.4533 357.43 -31.4936 357.424 -31.5367C357.408 -31.6459 357.393 -31.7581 357.377 -31.8673C357.371 -31.9133 357.365 -31.9564 357.359 -32.0024C357.343 -32.1146 357.334 -32.2296 357.321 -32.3446C357.315 -32.3877 357.312 -32.4308 357.305 -32.4768C357.293 -32.6148 357.281 -32.7586 357.271 -32.8994C357.271 -32.9196 357.268 -32.9397 357.265 -32.9569C357.256 -33.0949 357.246 -33.2387 357.24 -33.3796C357.24 -33.4026 357.24 -33.4227 357.237 -33.4457C357.231 -33.6038 357.224 -33.7648 357.221 -33.9258C357.221 -33.9316 357.221 -33.9344 357.221 -33.9402C357.221 -34.1069 357.218 -34.2766 357.221 -34.4462C357.221 -34.4606 357.221 -34.4721 357.221 -34.4836C357.221 -34.6388 357.218 -34.7941 357.221 -34.9493C357.221 -34.9924 357.221 -35.0356 357.221 -35.0758C357.221 -35.1994 357.224 -35.3231 357.231 -35.4438C357.231 -35.4984 357.237 -35.5559 357.237 -35.6106C357.243 -35.7169 357.246 -35.8262 357.252 -35.9326C357.256 -35.9958 357.262 -36.0591 357.268 -36.1223C357.274 -36.2201 357.281 -36.3178 357.29 -36.4127C357.296 -36.4961 357.305 -36.5794 357.315 -36.6628C357.321 -36.7376 357.33 -36.8123 357.337 -36.8842C357.349 -36.9819 357.362 -37.0797 357.377 -37.1746C357.383 -37.2321 357.393 -37.2896 357.399 -37.3471C357.415 -37.4477 357.433 -37.5512 357.449 -37.6518C357.458 -37.7007 357.465 -37.7524 357.474 -37.8042C357.49 -37.8962 357.508 -37.9882 357.527 -38.0802C357.539 -38.1377 357.549 -38.1952 357.561 -38.2527C357.58 -38.3447 357.602 -38.4338 357.624 -38.5229C357.636 -38.5804 357.649 -38.6351 357.661 -38.6926C357.683 -38.7846 357.708 -38.8766 357.733 -38.9686C357.745 -39.0203 357.758 -39.0721 357.773 -39.1238C357.798 -39.2158 357.823 -39.3021 357.851 -39.3941C357.867 -39.4458 357.88 -39.4976 357.895 -39.5493C357.92 -39.6327 357.948 -39.7132 357.976 -39.7966C357.995 -39.8541 358.011 -39.9087 358.029 -39.9662C358.054 -40.0409 358.082 -40.1157 358.11 -40.1904C358.132 -40.2508 358.154 -40.3141 358.176 -40.3744C358.204 -40.4463 358.232 -40.5182 358.26 -40.5901C358.285 -40.6504 358.307 -40.7137 358.332 -40.7741C358.357 -40.8402 358.388 -40.9034 358.413 -40.9696C358.441 -41.0357 358.469 -41.1018 358.497 -41.1679C358.522 -41.2226 358.547 -41.2772 358.572 -41.3318C358.607 -41.4066 358.641 -41.4813 358.675 -41.5532C358.7 -41.6021 358.722 -41.6481 358.747 -41.6969C358.784 -41.7746 358.825 -41.8522 358.862 -41.9298C358.881 -41.9672 358.903 -42.0046 358.922 -42.0419C358.968 -42.1282 359.012 -42.2144 359.059 -42.2978C359.071 -42.3179 359.084 -42.3381 359.093 -42.3611C359.149 -42.4617 359.206 -42.5623 359.265 -42.6601C359.274 -42.6773 359.287 -42.6946 359.296 -42.7118C359.355 -42.8124 359.418 -42.9131 359.48 -43.0137C359.483 -43.0194 359.486 -43.0252 359.489 -43.0309C361.118 -45.5868 363.502 -47.5102 366.263 -48.7953C366.291 -48.8097 366.322 -48.8212 366.35 -48.8356C366.447 -48.8787 366.544 -48.9247 366.641 -48.9678C366.7 -48.9937 366.759 -49.0167 366.818 -49.0426C366.887 -49.0713 366.956 -49.1029 367.024 -49.1317C367.121 -49.1719 367.218 -49.2093 367.318 -49.2496C367.349 -49.2611 367.38 -49.2754 367.411 -49.2869C378.219 -53.4931 393.703 -48.5941 393.463 -34.5008C393.688 -20.5398 378.656 -15.5431 367.879 -19.4531L367.892 -19.4617ZM355.118 182.703C352.367 184.787 348.722 186.089 344.18 186.112C340.027 186.207 336.589 187.556 334.183 189.85C331.853 192.072 330.495 195.186 330.411 198.915C330.371 203.092 328.954 206.439 326.705 208.96C323.113 212.988 317.398 214.914 311.747 214.765C302.821 214.529 294.063 209.104 294.15 198.573C294.129 198.156 294.122 197.75 294.125 197.359C294.144 193.987 294.99 191.466 296.394 189.528C299.486 185.261 305.286 183.807 310.911 182.271C316.596 180.719 322.109 179.086 324.477 174.379C324.976 173.388 325.335 172.26 325.525 170.97C325.613 170.386 325.666 169.771 325.681 169.118C325.856 161.37 331.575 154.97 339.303 153.15C339.59 153.084 339.877 153.021 340.17 152.966C341.337 152.748 342.545 152.633 343.78 152.63C355.667 152.443 361.58 161.048 361.474 169.581C361.415 174.569 359.296 179.534 355.112 182.703H355.118ZM486.012 293.163C485.999 293.189 485.987 293.218 485.974 293.243C485.931 293.335 485.89 293.427 485.843 293.519C485.806 293.597 485.768 293.672 485.731 293.747C485.709 293.787 485.69 293.83 485.669 293.873C485.619 293.971 485.566 294.066 485.516 294.16C485.506 294.181 485.494 294.201 485.484 294.224C484.031 296.886 481.822 299.169 478.867 300.672C478.858 300.678 478.848 300.681 478.839 300.687C478.73 300.741 478.617 300.796 478.508 300.848C478.486 300.856 478.468 300.868 478.449 300.877C478.355 300.92 478.262 300.963 478.168 301.006C478.127 301.023 478.09 301.043 478.049 301.061C477.965 301.098 477.878 301.132 477.794 301.17C477.744 301.19 477.694 301.213 477.641 301.236C477.56 301.268 477.479 301.299 477.397 301.331C477.338 301.354 477.282 301.377 477.226 301.4C477.154 301.426 477.079 301.452 477.007 301.48C476.939 301.506 476.87 301.532 476.798 301.555C476.736 301.575 476.674 301.598 476.611 301.618C476.53 301.644 476.449 301.673 476.365 301.699C476.305 301.719 476.243 301.736 476.184 301.753C476.096 301.779 476.009 301.808 475.922 301.831C475.859 301.848 475.797 301.866 475.734 301.883C475.647 301.909 475.56 301.932 475.469 301.955C475.41 301.969 475.354 301.983 475.295 301.998C475.198 302.021 475.104 302.047 475.007 302.07C474.948 302.084 474.892 302.095 474.833 302.107C474.733 302.127 474.636 302.15 474.536 302.17C474.474 302.185 474.412 302.196 474.346 302.208C474.249 302.225 474.156 302.245 474.059 302.262C473.997 302.274 473.931 302.282 473.869 302.294C473.772 302.311 473.672 302.328 473.575 302.343C473.519 302.351 473.463 302.36 473.404 302.366C473.298 302.383 473.189 302.397 473.079 302.412C473.017 302.42 472.951 302.426 472.886 302.435C472.783 302.446 472.683 302.461 472.577 302.469C472.483 302.478 472.39 302.486 472.293 302.495C472.218 302.501 472.14 302.51 472.065 302.515C471.966 302.524 471.863 302.53 471.76 302.535C471.688 302.541 471.616 302.547 471.544 302.55C471.419 302.556 471.292 302.561 471.164 302.567C471.114 302.567 471.067 302.573 471.017 302.573C470.877 302.578 470.736 302.579 470.596 302.581C470.558 302.581 470.521 302.581 470.48 302.581C470.312 302.581 470.14 302.581 469.969 302.581C469.956 302.581 469.944 302.581 469.931 302.581C469.566 302.581 469.204 302.581 468.849 302.564C468.842 302.564 468.836 302.564 468.83 302.564C468.658 302.558 468.49 302.55 468.318 302.538C468.293 302.538 468.271 302.535 468.246 302.533C468.097 302.524 467.947 302.512 467.797 302.501C467.747 302.498 467.697 302.492 467.647 302.487C467.526 302.475 467.407 302.464 467.289 302.452C467.236 302.446 467.183 302.438 467.129 302.432C467.014 302.418 466.899 302.406 466.783 302.389C466.736 302.383 466.69 302.374 466.643 302.369C466.524 302.351 466.406 302.334 466.29 302.317C466.247 302.311 466.206 302.303 466.162 302.294C466.044 302.274 465.922 302.254 465.803 302.231C465.76 302.222 465.713 302.213 465.669 302.205C465.554 302.182 465.438 302.159 465.326 302.136C465.292 302.13 465.261 302.121 465.226 302.113C465.101 302.087 464.98 302.058 464.858 302.029C464.827 302.021 464.796 302.012 464.765 302.006C464.643 301.975 464.521 301.946 464.399 301.914C464.375 301.909 464.346 301.9 464.321 301.891C464.197 301.857 464.072 301.822 463.947 301.788C463.931 301.782 463.916 301.779 463.897 301.774C463.766 301.733 463.632 301.693 463.504 301.653C463.495 301.653 463.488 301.647 463.479 301.644C458.958 300.175 455.81 297.119 454.035 293.439C454.025 293.419 454.016 293.401 454.007 293.381C453.96 293.281 453.91 293.18 453.866 293.079C453.845 293.028 453.823 292.979 453.798 292.927C453.767 292.858 453.735 292.789 453.707 292.72C453.664 292.62 453.623 292.519 453.582 292.418C453.573 292.398 453.564 292.375 453.557 292.355C449.608 282.431 455.074 268.889 470.012 269.099C485.272 268.884 490.573 283.181 486.018 293.16L486.012 293.163ZM336.717 300.96C336.698 300.954 336.682 300.948 336.664 300.94C336.548 300.9 336.436 300.862 336.32 300.819C336.239 300.79 336.158 300.759 336.074 300.727C336.024 300.707 335.977 300.69 335.927 300.672C331.778 299.057 328.311 296.093 326.683 291.786C326.68 291.774 326.673 291.763 326.67 291.751C326.627 291.636 326.586 291.518 326.542 291.398C326.536 291.378 326.53 291.36 326.524 291.34C326.486 291.228 326.449 291.116 326.414 291.004C326.405 290.975 326.396 290.949 326.389 290.923C326.355 290.814 326.324 290.705 326.293 290.596C326.283 290.561 326.274 290.529 326.265 290.498C326.24 290.4 326.215 290.302 326.19 290.204C326.177 290.159 326.165 290.113 326.152 290.064C326.13 289.969 326.109 289.871 326.087 289.773C326.074 289.724 326.062 289.673 326.052 289.624C326.034 289.532 326.015 289.44 325.996 289.348C325.984 289.29 325.971 289.233 325.962 289.175C325.943 289.078 325.928 288.977 325.912 288.879C325.903 288.824 325.893 288.773 325.884 288.718C325.868 288.626 325.859 288.531 325.843 288.436C325.834 288.376 325.825 288.316 325.818 288.252C325.806 288.152 325.797 288.048 325.784 287.945C325.778 287.89 325.772 287.836 325.765 287.781C325.753 287.663 325.744 287.542 325.737 287.422C325.737 287.381 325.731 287.341 325.728 287.301C325.719 287.166 325.712 287.033 325.706 286.898C325.706 286.87 325.703 286.841 325.703 286.812C325.697 286.674 325.694 286.536 325.691 286.398C325.691 286.372 325.691 286.343 325.691 286.318C325.691 286.154 325.691 285.99 325.691 285.823V285.809C325.691 285.639 325.691 285.472 325.691 285.306C325.691 285.294 325.691 285.283 325.691 285.268C325.691 285.116 325.697 284.961 325.703 284.808C325.703 284.791 325.703 284.777 325.703 284.759C325.709 284.613 325.715 284.466 325.725 284.319C325.728 284.262 325.734 284.207 325.737 284.15C325.747 284.046 325.753 283.943 325.762 283.839C325.769 283.77 325.778 283.701 325.784 283.632C325.794 283.543 325.803 283.454 325.812 283.368C325.822 283.302 325.831 283.236 325.84 283.169C325.853 283.08 325.865 282.994 325.878 282.905C325.89 282.822 325.906 282.735 325.921 282.652C325.934 282.586 325.943 282.517 325.956 282.448C325.971 282.362 325.99 282.278 326.006 282.192C326.018 282.129 326.031 282.063 326.043 281.999C326.062 281.916 326.081 281.835 326.099 281.755C326.115 281.689 326.127 281.623 326.143 281.559C326.165 281.476 326.187 281.39 326.208 281.306C326.224 281.246 326.24 281.186 326.255 281.128C326.277 281.053 326.299 280.979 326.321 280.907C326.339 280.841 326.358 280.772 326.38 280.706C326.402 280.637 326.424 280.57 326.446 280.501C326.467 280.43 326.489 280.358 326.514 280.289C326.542 280.211 326.57 280.131 326.598 280.053C326.62 279.995 326.639 279.938 326.661 279.88C326.689 279.806 326.717 279.734 326.748 279.659C326.77 279.599 326.795 279.538 326.82 279.478C326.845 279.418 326.87 279.36 326.895 279.3C326.926 279.228 326.954 279.156 326.985 279.084C327.004 279.038 327.026 278.995 327.048 278.949C327.085 278.866 327.123 278.782 327.163 278.699C327.182 278.661 327.201 278.624 327.219 278.587C327.263 278.498 327.307 278.411 327.35 278.325C327.369 278.288 327.391 278.25 327.41 278.213C327.456 278.127 327.5 278.04 327.547 277.954C327.553 277.94 327.563 277.925 327.572 277.914C327.631 277.807 327.694 277.701 327.756 277.595C327.756 277.589 327.762 277.586 327.765 277.58C327.834 277.465 327.903 277.353 327.974 277.241C329.609 274.682 331.999 272.759 334.77 271.477C334.804 271.46 334.841 271.445 334.876 271.428C334.966 271.388 335.057 271.345 335.15 271.304C335.213 271.276 335.278 271.25 335.344 271.221C335.406 271.195 335.469 271.166 335.534 271.14C335.65 271.094 335.765 271.048 335.88 271.002L335.921 270.985C346.738 266.799 362.204 271.721 361.939 285.829C362.132 299.617 347.449 304.631 336.71 300.957L336.717 300.96ZM425.009 344.027C425.181 354.987 415.883 360.464 406.661 360.375C401.269 360.323 395.903 358.368 392.468 354.495C390.209 351.948 388.789 348.567 388.749 344.355C388.649 340.626 387.276 337.53 384.924 335.333C384.908 335.319 384.893 335.302 384.874 335.287C384.855 335.27 384.836 335.256 384.818 335.238C382.434 333.071 379.077 331.803 375.024 331.705C370.463 331.662 366.806 330.345 364.048 328.255C359.752 324.995 357.639 319.86 357.699 314.751C357.792 306.397 363.686 298.116 375.286 298.223C375.333 298.223 375.38 298.223 375.426 298.223C375.891 298.223 376.353 298.24 376.805 298.272C386.069 298.922 393.326 305.957 393.473 314.714C393.491 315.395 393.554 316.034 393.647 316.64C393.847 317.899 394.206 319.003 394.699 319.972C397.154 324.814 402.929 326.401 408.789 327.991C413.609 329.299 418.486 330.61 421.621 333.738C423.883 335.995 425.234 339.197 425.006 344.027H425.009ZM564.636 123.512C579.708 123.319 585.037 137.28 580.754 147.237C580.754 147.242 580.747 147.245 580.747 147.251C580.698 147.366 580.644 147.484 580.591 147.599C580.573 147.639 580.551 147.679 580.532 147.722C580.495 147.8 580.46 147.878 580.423 147.958C580.392 148.021 580.361 148.085 580.326 148.148C580.298 148.203 580.273 148.257 580.245 148.312C580.201 148.395 580.158 148.479 580.114 148.559C580.095 148.594 580.08 148.628 580.061 148.66C578.666 151.201 576.585 153.395 573.824 154.893C573.812 154.898 573.799 154.907 573.787 154.913C573.687 154.967 573.584 155.019 573.481 155.071C573.453 155.085 573.428 155.1 573.403 155.111C573.297 155.166 573.191 155.215 573.082 155.266C573.057 155.278 573.035 155.289 573.01 155.301C572.916 155.344 572.823 155.387 572.729 155.427C572.688 155.445 572.648 155.465 572.607 155.482C572.529 155.517 572.448 155.551 572.367 155.583C572.311 155.606 572.255 155.632 572.199 155.655C572.127 155.683 572.055 155.712 571.983 155.738C571.915 155.764 571.849 155.79 571.781 155.816C571.718 155.839 571.653 155.862 571.59 155.885C571.512 155.913 571.434 155.942 571.356 155.968C571.3 155.988 571.241 156.005 571.181 156.025C571.094 156.054 571.01 156.083 570.922 156.112C570.866 156.129 570.81 156.146 570.754 156.161C570.66 156.189 570.57 156.218 570.479 156.244C570.43 156.258 570.38 156.27 570.333 156.284C570.23 156.313 570.13 156.342 570.027 156.368C569.971 156.382 569.918 156.393 569.862 156.408C569.762 156.431 569.665 156.457 569.565 156.48C569.506 156.494 569.444 156.506 569.384 156.52C569.288 156.54 569.194 156.563 569.094 156.583C569.044 156.595 568.991 156.603 568.941 156.612C568.832 156.632 568.726 156.655 568.617 156.672C568.564 156.681 568.511 156.69 568.458 156.698C568.349 156.715 568.239 156.736 568.13 156.753C568.08 156.761 568.03 156.767 567.983 156.773C567.868 156.79 567.753 156.807 567.637 156.822C567.584 156.828 567.531 156.833 567.478 156.839C567.363 156.853 567.25 156.868 567.135 156.879C567.054 156.888 566.969 156.894 566.885 156.902C566.798 156.911 566.711 156.92 566.623 156.925C566.533 156.931 566.439 156.937 566.345 156.943C566.264 156.948 566.186 156.954 566.102 156.957C565.99 156.963 565.871 156.966 565.759 156.971C565.696 156.971 565.637 156.977 565.575 156.98C565.425 156.983 565.275 156.986 565.122 156.989C565.094 156.989 565.066 156.989 565.038 156.989C564.876 156.989 564.714 156.989 564.551 156.989H564.492C564.308 156.989 564.127 156.989 563.946 156.989C563.584 156.983 563.232 156.968 562.882 156.945C562.867 156.945 562.854 156.945 562.839 156.945C562.68 156.934 562.52 156.922 562.361 156.911C562.318 156.908 562.277 156.902 562.236 156.899C562.109 156.888 561.977 156.876 561.85 156.862C561.812 156.859 561.775 156.853 561.74 156.848C561.609 156.833 561.478 156.816 561.347 156.799C561.328 156.799 561.31 156.793 561.291 156.79C561.144 156.77 560.998 156.75 560.851 156.724C560.817 156.718 560.786 156.713 560.751 156.707C560.62 156.687 560.492 156.664 560.365 156.641C560.321 156.632 560.28 156.623 560.24 156.615C560.121 156.592 560.003 156.569 559.887 156.546C559.843 156.537 559.8 156.526 559.753 156.514C559.641 156.488 559.528 156.465 559.419 156.439C559.382 156.431 559.344 156.419 559.307 156.411C559.191 156.382 559.076 156.353 558.96 156.322C558.942 156.316 558.926 156.313 558.907 156.307C558.773 156.273 558.642 156.232 558.511 156.195C558.499 156.192 558.483 156.186 558.471 156.184C558.336 156.143 558.202 156.103 558.068 156.06C557.922 156.014 557.778 155.962 557.634 155.913C553.195 154.338 550.134 151.201 548.452 147.472C548.43 147.421 548.409 147.369 548.384 147.317C548.352 147.248 548.321 147.179 548.293 147.11C548.246 147.001 548.203 146.894 548.159 146.785C548.153 146.771 548.146 146.759 548.143 146.745C544.212 136.815 549.703 123.285 564.642 123.518L564.636 123.512ZM446.984 -19.4531C446.984 -19.4531 446.965 -19.4444 446.956 -19.4387C446.834 -19.3812 446.709 -19.3237 446.584 -19.2662C446.575 -19.2633 446.566 -19.2576 446.556 -19.2547C446.435 -19.2001 446.31 -19.1483 446.185 -19.0966C446.172 -19.0908 446.16 -19.0851 446.147 -19.0793C446.038 -19.0333 445.926 -18.9902 445.814 -18.9471C445.786 -18.9356 445.758 -18.9241 445.729 -18.9126C445.636 -18.8781 445.539 -18.8436 445.445 -18.8091C445.399 -18.7918 445.352 -18.7746 445.305 -18.7573C445.215 -18.7257 445.124 -18.697 445.034 -18.6653C444.981 -18.6481 444.924 -18.6279 444.871 -18.6107C444.784 -18.582 444.694 -18.5561 444.606 -18.5302C444.547 -18.513 444.488 -18.4928 444.428 -18.4756C444.335 -18.4497 444.238 -18.4209 444.144 -18.3951C444.088 -18.3807 444.035 -18.3634 443.979 -18.3491C443.889 -18.3261 443.798 -18.3031 443.708 -18.2801C443.645 -18.2657 443.583 -18.2484 443.52 -18.2341C443.439 -18.2139 443.355 -18.1967 443.274 -18.1794C443.199 -18.1622 443.127 -18.1449 443.052 -18.1306C442.968 -18.1133 442.881 -18.0961 442.793 -18.0788C442.722 -18.0645 442.65 -18.0501 442.575 -18.0357C442.491 -18.0213 442.404 -18.0069 442.316 -17.9926C442.241 -17.9782 442.166 -17.9667 442.088 -17.9523C441.998 -17.9379 441.904 -17.9264 441.811 -17.9121C441.739 -17.9006 441.667 -17.8891 441.595 -17.8804C441.496 -17.8661 441.393 -17.8575 441.293 -17.8459C441.227 -17.8373 441.162 -17.8287 441.093 -17.8229C440.99 -17.8114 440.884 -17.8028 440.781 -17.7942C440.716 -17.7884 440.65 -17.7798 440.585 -17.7741C440.453 -17.7626 440.319 -17.7539 440.185 -17.7453C440.145 -17.7453 440.107 -17.7396 440.067 -17.7367C439.911 -17.7281 439.755 -17.7223 439.595 -17.7166C439.577 -17.7166 439.558 -17.7166 439.539 -17.7137C439.184 -17.7022 438.822 -17.6964 438.454 -17.7022H438.388C438.226 -17.7022 438.067 -17.7022 437.908 -17.7022C437.876 -17.7022 437.848 -17.7022 437.82 -17.7022C437.67 -17.7022 437.518 -17.7079 437.371 -17.7137C437.318 -17.7137 437.268 -17.7195 437.218 -17.7195C437.09 -17.7252 436.965 -17.7309 436.841 -17.7367C436.775 -17.7396 436.713 -17.7453 436.647 -17.7511C436.538 -17.7568 436.429 -17.7654 436.319 -17.7741C436.248 -17.7798 436.176 -17.7884 436.107 -17.7942C436.008 -17.8028 435.908 -17.8114 435.808 -17.8229C435.724 -17.8316 435.642 -17.8431 435.558 -17.8517C435.474 -17.8603 435.387 -17.8718 435.302 -17.8804C435.215 -17.892 435.131 -17.9063 435.043 -17.9178C434.965 -17.9293 434.887 -17.9408 434.809 -17.9523C434.731 -17.9638 434.657 -17.9782 434.579 -17.9897C434.494 -18.0041 434.407 -18.0184 434.323 -18.0328C434.251 -18.0472 434.179 -18.0616 434.104 -18.0759C434.017 -18.0932 433.93 -18.1076 433.845 -18.1277C433.767 -18.1449 433.692 -18.1622 433.614 -18.1794C433.536 -18.1967 433.455 -18.214 433.377 -18.2312C433.309 -18.2484 433.24 -18.2657 433.171 -18.2829C433.087 -18.3031 433 -18.3232 432.916 -18.3462C432.866 -18.3606 432.813 -18.3749 432.763 -18.3893C432.663 -18.4181 432.563 -18.4439 432.463 -18.4727C432.423 -18.4842 432.382 -18.4986 432.341 -18.5101C432.235 -18.5417 432.126 -18.5733 432.02 -18.6078C431.992 -18.6164 431.964 -18.6279 431.936 -18.6366C431.817 -18.6739 431.699 -18.7142 431.583 -18.7544C431.565 -18.7602 431.546 -18.7688 431.527 -18.7746C431.402 -18.8177 431.278 -18.8637 431.156 -18.9097C431.143 -18.9154 431.131 -18.9212 431.115 -18.9241C427.056 -20.4766 424.189 -23.3631 422.52 -26.7958C422.51 -26.8159 422.501 -26.8361 422.492 -26.8591C422.445 -26.9568 422.398 -27.0546 422.351 -27.1552C422.323 -27.2156 422.298 -27.2788 422.27 -27.3392C422.245 -27.3967 422.217 -27.4571 422.192 -27.5174C417.927 -37.4621 423.297 -51.3656 438.41 -51.1873C453.504 -51.4346 458.896 -37.4994 454.656 -27.5318C454.656 -27.5289 454.653 -27.5232 454.649 -27.5203C454.6 -27.4024 454.55 -27.2874 454.497 -27.1696C454.478 -27.1264 454.456 -27.0804 454.434 -27.0373C454.4 -26.9626 454.362 -26.8849 454.328 -26.8102C454.291 -26.7326 454.253 -26.6578 454.216 -26.5831C454.194 -26.5399 454.175 -26.4997 454.153 -26.4566C454.094 -26.3416 454.035 -26.2294 453.976 -26.1173C453.976 -26.1144 453.972 -26.1116 453.969 -26.1058C452.459 -23.3228 450.129 -20.9509 446.981 -19.4444L446.984 -19.4531ZM613.732 -63.7108C613.763 -59.0476 611.994 -54.3699 608.428 -51.1269C605.617 -48.5682 601.689 -46.9007 596.647 -46.8317C596.475 -46.8317 596.304 -46.8288 596.129 -46.8317C595.773 -46.8202 595.427 -46.8001 595.093 -46.7713C591.652 -46.4838 589.221 -45.3223 587.415 -43.6146C583.328 -39.7477 582.42 -33.0949 580.13 -27.4973C577.852 -21.9227 574.205 -17.3946 564.682 -17.7166C555.844 -17.7712 551.454 -11.5842 551.457 -5.3857C551.46 0.838684 555.893 7.08031 564.692 7.03719C570.542 7.00555 574.925 9.08705 577.846 12.2265C580.672 15.2654 582.126 19.299 582.211 23.3614C582.389 31.8858 576.542 40.5539 564.695 40.5194C555.064 40.781 552.727 47.3562 550.54 54.19C549.22 58.3214 547.953 62.5506 545.167 65.5377C542.699 68.1827 539.039 69.8588 533.093 69.6345C526.906 69.8847 523.168 68.0993 520.675 65.3019C518.213 62.5419 516.962 58.7958 515.761 55.0526C513.936 49.3629 512.223 43.6819 506.541 41.4739C505.053 40.896 503.287 40.5568 501.178 40.5166C501.128 40.5166 501.078 40.5166 501.028 40.5166C480.655 40.8673 487.6 18.9368 476.255 12.9108C474.839 12.1575 473.135 11.6544 471.058 11.4733C470.583 11.4302 470.09 11.4072 469.576 11.3985C457.963 11.272 452.219 2.85118 452.288 -5.51219C452.353 -13.8899 458.247 -22.2102 469.909 -22.0837C474.193 -22.2849 477.301 -21.4943 479.634 -20.0568C485.269 -16.5867 486.389 -9.3532 488.664 -3.22945C489.996 0.352798 491.721 3.55554 494.982 5.39842C496.673 6.35292 498.776 6.94519 501.446 7.03143C501.468 7.03143 501.493 7.03143 501.515 7.0343C501.574 7.0343 501.63 7.02853 501.69 7.02567C504.46 6.90779 506.61 6.2523 508.32 5.20293C508.351 5.1828 508.382 5.16267 508.416 5.14255C508.479 5.10518 508.541 5.06493 508.601 5.02756C513.352 1.91394 514.585 -4.30183 516.553 -10.0001C517.78 -13.5507 519.293 -16.9001 522.126 -19.1713C524.491 -21.0688 527.776 -22.2131 532.581 -22.0952C532.709 -22.0923 532.834 -22.0894 532.965 -22.0837C535.691 -22.1843 537.832 -22.7852 539.545 -23.7512C543.513 -25.9908 545.201 -30.1883 546.649 -34.6388C548.249 -39.5579 549.557 -44.7904 553.329 -48.0306C555.737 -50.1006 559.148 -51.3569 564.28 -51.2017C564.324 -51.2017 564.367 -51.2017 564.411 -51.2017C565.868 -51.2506 567.16 -51.4432 568.305 -51.7566C573.4 -53.1509 575.696 -56.9603 577.353 -61.3591C579.506 -67.0774 580.576 -73.7992 585.309 -77.5166C587.633 -79.3422 590.844 -80.4433 595.496 -80.3484C595.77 -80.3427 596.045 -80.3341 596.329 -80.3197C607.879 -80.3456 613.679 -72.0569 613.732 -63.7194V-63.7108Z"
            fill={color}
        />
        <path
            d="M353.234 14.8572C351.09 12.7757 348.005 11.4129 343.98 11.4014C340.966 11.4445 338.673 12.1317 336.869 13.2673C333.241 15.0613 330.555 18.4049 330.417 23.3097C328.979 27.5762 327.821 32.156 325.201 35.5227C321.984 38.5385 317.525 40.4245 312.546 40.5194C312.54 40.5194 312.533 40.5194 312.524 40.5194C312.05 40.528 311.594 40.5539 311.154 40.5942C303.616 41.2698 301.002 46.255 299.049 51.913C297.22 57.1858 295.969 63.0393 291.882 66.5324C289.433 68.6139 285.967 69.8559 280.753 69.6374C280.653 69.6374 280.557 69.6374 280.46 69.6374C270.757 69.5885 265.088 63.62 263.543 56.7344C262.701 52.9394 263.103 48.8655 264.76 45.3523C267.225 40.1658 272.451 36.2012 280.488 36.158C280.507 36.158 280.522 36.158 280.541 36.158C280.56 36.158 280.578 36.158 280.597 36.158C288.091 36.0229 293.607 31.1785 294.116 24.4108C295.573 20.0724 296.681 15.389 299.389 11.9793C303.042 9.47229 308.075 8.3913 312.764 7.04292C318.14 6.95955 321.794 4.41229 323.728 0.982416C324.904 -0.650583 325.622 -2.71771 325.684 -5.40871C325.737 -9.30721 324.177 -12.2512 321.784 -14.2493C319.622 -16.3855 316.48 -17.7655 312.356 -17.7108C309.051 -17.7195 306.072 -16.6758 303.76 -14.8991C300.805 -12.8837 298.793 -9.64933 298.883 -5.21033C298.787 0.43329 295.763 5.37542 291.168 8.37117C284.279 12.3243 274.357 11.7838 268.208 6.82154C265.303 3.35717 264.123 -1.54758 262.582 -6.06133C262.052 -12.7917 256.414 -17.7425 249.135 -17.7108H249.113C231.828 -17.8373 231.81 7.26142 249.303 7.04004H249.316C255.338 7.13492 260.548 9.73104 263.799 13.7589C268.482 20.334 267.821 30.1723 261.924 35.9108C255.612 41.0829 245.169 41.4509 238.209 37.0435C233.956 33.9989 231.192 29.2235 231.089 23.7898V23.7697C231.089 23.7697 231.089 23.7639 231.089 23.761C231.148 19.0892 228.93 15.7887 225.751 13.8423C223.523 12.3013 220.74 11.4043 217.673 11.4072C213.555 11.3928 210.41 12.7872 208.241 14.9204C205.833 16.9185 204.251 19.851 204.285 23.7007C204.382 26.36 205.099 28.4128 206.254 30.0372C208.173 33.4383 211.807 35.9855 217.174 36.1465C221.885 37.5007 226.949 38.5615 230.612 41.0858C233.788 44.0499 235.716 48.1583 235.816 52.8733C235.816 52.879 235.816 52.8877 235.816 52.8934C235.822 53.0257 235.831 53.1579 235.841 53.2873C236.112 57.318 237.869 59.9055 240.427 61.7312C249.319 68.0993 267.877 65.1323 267.375 81.5025C267.368 81.6952 267.359 81.8907 267.35 82.089C267.356 82.7675 267.325 83.423 267.262 84.0584C266.295 93.6149 257.649 98.3845 249.054 98.3213C240.43 98.2322 231.853 93.2757 231.139 83.4604C231.105 82.9832 231.089 82.4944 231.092 81.9913C230.874 76.8105 228.356 73.9442 224.824 72.0582C215.448 67.0327 198.956 68.9762 199.561 52.9452C199.561 52.9308 199.561 52.9164 199.561 52.902C199.602 48.3078 197.458 45.0303 194.373 43.058C192.139 41.4624 189.328 40.528 186.211 40.5223C183.181 40.5942 180.876 41.3158 179.072 42.4859C175.559 44.2914 172.957 47.5632 172.773 52.2782C171.307 56.5763 170.168 61.2165 167.556 64.6205C164.271 67.7428 159.697 69.6547 154.602 69.6374H154.599C154.599 69.6374 154.577 69.6374 154.565 69.6374C149.825 69.8502 146.543 68.8123 144.153 67.0154C139.352 63.3757 138.169 56.6223 136.001 50.8464C133.957 45.358 131.027 40.7494 123.218 40.5223C123.196 40.5223 123.171 40.5223 123.149 40.5223C123.149 40.5223 123.146 40.5223 123.143 40.5223C115.961 40.5165 110.183 45.6082 109.727 52.2235C108.245 56.6079 107.122 61.3488 104.386 64.7844C100.692 67.2828 95.6154 68.3063 90.9105 69.6489C85.5285 69.7869 81.9124 72.3802 80.0435 75.8417C78.9421 77.4545 78.262 79.4843 78.1684 82.0977C78.1871 85.8409 79.6785 88.7102 81.9529 90.6997C84.1089 92.9335 87.2756 94.4084 91.4502 94.394C94.3456 94.3222 96.5826 93.6667 98.3548 92.5972C102.018 90.8492 104.763 87.54 104.963 82.6583C106.461 78.294 107.609 73.579 110.301 70.1549C113.53 67.1275 117.995 65.2933 123.034 65.2732C123.043 65.2732 123.053 65.2732 123.065 65.2732C123.199 65.2674 123.33 65.2617 123.465 65.2559C127.536 65.1237 130.516 65.8942 132.768 67.2655C137.988 70.4712 139.299 76.9457 141.305 82.7704C143.024 87.8132 145.27 92.37 151.083 93.8852C152.112 94.1554 153.254 94.3279 154.524 94.3912H154.527C159.769 94.5061 164.227 96.2484 167.425 99.1752C170.177 102.579 171.303 107.297 172.779 111.673C172.979 116.658 175.806 120.019 179.55 121.77C181.294 122.782 183.484 123.411 186.295 123.506C189.321 123.48 192.098 122.535 194.323 120.953C197.402 118.998 199.558 115.764 199.571 111.259C199.667 105.785 202.316 101.03 206.463 97.9763C212.987 93.6753 222.718 93.7155 229.167 98.1028C233.161 101.119 235.697 105.745 235.828 111.104C235.828 111.124 235.828 111.141 235.828 111.161C235.834 111.296 235.844 111.431 235.853 111.564C236.134 115.445 237.791 117.989 240.212 119.8C244.258 122.842 250.436 123.811 255.884 125.573C257.883 126.22 259.784 126.976 261.443 127.977C261.456 127.986 261.471 127.994 261.484 128.003C261.565 128.052 261.646 128.101 261.727 128.152C265.256 130.383 267.618 133.813 267.384 139.877C267.378 140.035 267.368 140.196 267.359 140.357C267.365 141.308 267.3 142.217 267.172 143.085C265.811 152.167 257.337 156.667 248.945 156.554C239.934 156.419 231.017 150.968 231.101 140.193C231.03 136.076 228.961 132.514 225.741 130.294C223.539 128.776 220.799 127.885 217.791 127.873C216.696 127.899 215.698 128.011 214.781 128.195C206.46 129.872 205.049 137.715 202.61 144.796C201.04 149.338 199.047 153.567 194.544 155.655C192.448 156.626 189.805 157.132 186.407 156.997C186.333 156.997 186.258 156.991 186.18 156.989C186.158 156.989 186.139 156.989 186.117 156.989C182.464 157.15 179.671 156.572 177.49 155.476C171.397 152.403 170.052 145.27 167.837 139.023C166.034 133.905 163.647 129.386 157.56 128.181C156.649 128 155.66 127.894 154.574 127.871C154.412 127.871 154.25 127.871 154.09 127.876C144.699 128.072 140.596 135.765 141.795 142.522C142.365 145.79 144.178 148.838 147.248 150.715C149.22 151.923 151.704 152.644 154.705 152.624C154.814 152.624 154.923 152.624 155.033 152.624C156.022 152.633 156.97 152.699 157.872 152.82C168.711 154.292 173.444 163.687 172.112 172.123C170.929 179.503 165.107 186.147 154.721 186.107C149.894 186.078 146.397 187.952 144.228 190.681C142.35 192.791 141.239 195.488 141.236 198.455C141.342 201.105 142.06 203.15 143.214 204.771C145.142 208.161 148.783 210.694 154.134 210.849C158.767 212.168 163.744 213.203 167.391 215.636C170.673 218.614 172.686 222.771 172.77 227.501C172.888 234.277 178.327 239.527 185.521 239.947C190.398 241.358 195.674 242.425 199.393 245.09C205.393 251.395 205.349 262.041 199.327 268.343C195.574 271.005 190.264 272.075 185.375 273.507C181.415 273.829 178.773 275.26 176.876 277.333C174.651 279.084 173.122 281.508 172.81 285.107C171.341 289.457 170.243 294.166 167.544 297.602C164.299 300.649 159.759 302.501 154.549 302.576H154.533C150.103 302.55 146.802 304.186 144.643 306.627C142.231 309.326 141.242 313.015 141.679 316.531C142.344 322.106 146.559 327.243 154.374 327.327C154.387 327.327 154.396 327.327 154.409 327.327C160.708 327.499 165.971 330.043 169.226 334.04C173.996 340.638 173.278 350.525 167.241 356.255C160.405 361.809 148.839 361.746 142.01 356.117C139.105 352.624 137.994 347.71 136.459 343.202C136.129 339.738 134.659 337.372 132.522 335.641C130.637 333.539 128.01 332.076 124.051 331.737C119.287 330.317 114.101 329.264 110.332 326.769C107.022 323.782 105.003 319.662 104.969 315.036C104.969 315.027 104.969 315.019 104.969 315.007C104.963 314.904 104.96 314.806 104.954 314.705C104.741 309.421 106.47 306.121 109.219 303.875C113.933 300.054 121.642 299.281 127.667 296.921C130.313 295.888 132.634 294.549 134.235 292.502C135.408 291.01 136.191 289.141 136.437 286.746C136.466 286.49 136.484 286.226 136.5 285.958C136.665 276.399 144.347 269.272 154.677 269.088H154.683C159.644 269.122 163.185 267.095 165.31 264.192C167.035 262.101 168.043 259.482 168.031 256.619C168.093 252.703 166.508 249.748 164.084 247.752C161.922 245.642 158.786 244.279 154.683 244.337C151.576 244.331 148.743 245.274 146.484 246.878C143.348 248.851 141.171 252.125 141.23 256.702V256.708C141.236 263.875 137.339 268.674 132.098 271.12C129.424 272.362 126.4 272.998 123.368 273.029C114.198 273.107 104.935 267.613 104.969 256.613C104.969 256.593 104.969 256.57 104.966 256.55C104.816 249.903 99.4904 244.805 92.3768 244.366C87.622 242.991 82.4677 241.962 78.7362 239.412C75.9688 235.985 74.858 231.273 73.4104 226.914C72.9486 220.282 67.3295 215.259 60.1691 215.219H60.1597C52.9276 215.187 47.1369 220.262 46.6657 226.917C45.399 230.617 44.3881 234.576 42.4693 237.785C40.9592 240.019 39.2214 241.652 37.3494 242.773C35.1124 243.926 32.2264 244.529 28.3981 244.337C27.512 244.337 26.6603 244.291 25.8397 244.199C19.946 242.698 14.4642 238.285 11.7248 233.081C9.91837 227.561 10.923 221.144 14.7481 216.628C17.7246 214.178 22.2049 212.143 28.5572 210.852C28.5572 210.852 28.5604 210.852 28.5635 210.852C35.8424 210.719 41.4803 205.685 41.8828 199.073C43.3492 194.749 44.4755 190.088 47.1587 186.684C50.3941 183.669 54.8963 181.82 60.0131 181.737H60.0193C67.3451 181.616 72.9486 176.651 73.4072 169.998C74.883 165.631 76.0062 160.913 78.7393 157.495C82.4521 154.95 87.5689 153.932 92.2988 152.578C96.2706 152.291 98.9195 150.862 100.82 148.783C103.047 147.03 104.582 144.586 104.913 140.923C106.37 136.613 107.478 131.956 110.133 128.54C113.368 125.479 117.87 123.578 122.928 123.503C132.55 123.664 136.902 116.279 136.085 109.537C135.695 106.219 134.048 103.054 131.133 101.021C129.174 99.6438 126.644 98.7899 123.549 98.7554C123.436 98.7554 123.321 98.7554 123.206 98.7554C122.404 98.7755 121.652 98.8388 120.95 98.9452C108.869 100.731 110.501 114.413 104.922 122.31C103.771 123.938 102.317 125.318 100.377 126.301C100.302 126.338 100.224 126.376 100.149 126.413C100.114 126.43 100.08 126.447 100.046 126.462C97.8868 127.474 95.1474 128.009 91.5937 127.871C84.2773 127.974 78.6707 132.933 78.1933 139.592C76.7581 143.879 75.6693 148.504 73.0453 151.911C69.7912 155.008 65.2141 156.911 60.0068 156.991C59.9975 156.991 59.9881 156.991 59.9788 156.991C58.3689 157.06 56.9648 157.305 55.7356 157.696C45.6299 160.876 47.115 173.779 41.4896 181.064C39.0404 184.223 35.2528 186.325 28.604 186.118C28.526 186.118 28.448 186.115 28.3669 186.109C28.2733 186.115 28.1797 186.124 28.0861 186.13C27.0628 186.204 26.1205 186.345 25.2594 186.549C13.2724 189.375 16.0148 203.914 9.10717 211.165C7.09165 213.275 4.25557 214.765 0.00924683 215.173V240.019C3.72829 240.272 6.37405 241.482 8.34901 243.276C12.0868 246.674 13.4377 252.163 15.1787 257.208C17.319 263.41 20.0459 268.944 28.5198 269.099C32.7443 269.001 35.5398 267.584 37.546 265.425C39.3524 263.479 40.5193 260.928 41.5115 258.191C43.5644 252.536 44.878 246.096 49.5923 242.574C52.0696 240.726 55.486 239.679 60.4468 239.984C68.1376 239.771 71.9408 242.764 74.2996 246.901C79.095 255.308 77.9375 268.449 91.3379 269.085C91.4689 269.091 91.6031 269.096 91.7373 269.099C93.3815 269.093 94.9072 269.254 96.3205 269.559C101.568 270.692 105.213 273.794 107.265 277.675C110.981 284.702 109.462 294.27 102.726 299.255C99.9397 301.316 96.2675 302.593 91.7029 302.581H91.678C87.7967 302.567 84.7765 303.757 82.6113 305.626C80.6893 307.282 79.4413 309.467 78.8641 311.816C77.1544 318.756 81.3008 327.105 91.2412 327.329C91.4065 327.332 91.5688 327.335 91.7373 327.335C91.99 327.327 92.2365 327.324 92.4829 327.321C100.423 327.266 104.086 330.699 106.351 335.227C110.601 343.723 109.93 356.071 123.346 356.453C123.424 356.45 123.502 356.45 123.58 356.447C136.6 356.082 138.441 365.11 141.111 373.209C143.174 379.462 145.735 385.163 154.321 385.557C154.427 385.563 154.533 385.568 154.643 385.571C154.665 385.571 154.686 385.571 154.711 385.571C163.195 385.301 165.915 379.907 167.99 373.83C169.534 369.31 170.72 364.411 173.653 360.967C176.171 358.006 179.98 356.117 186.411 356.459C191.774 356.427 195.902 358.207 198.788 360.958C204.759 366.651 205.424 376.509 200.759 383.125C197.933 387.138 193.147 389.958 186.392 389.938C182.027 390.016 178.258 391.738 175.796 394.458C173.884 396.571 172.764 399.282 172.764 402.295C172.839 405.061 173.625 407.165 174.901 408.818C177.272 411.892 181.337 413.401 185.705 414.672C191.112 416.247 196.975 417.458 200.641 420.819C202.313 422.351 203.527 424.335 204.032 427.003H230.253C228.481 422.61 223.922 419.373 218.484 419.079C213.648 417.673 208.394 416.592 204.65 413.953C198.522 407.651 198.46 396.996 204.535 390.692C208.285 388.029 213.589 386.966 218.472 385.542C225.657 385.082 231.129 379.758 231.098 373.105C231.095 372.251 231.002 371.42 230.824 370.618C229.588 365.015 224.328 360.915 217.754 360.82C217.738 360.82 217.726 360.82 217.71 360.82C194.301 360.748 194.017 327.545 217.523 327.338C217.598 327.338 217.673 327.338 217.748 327.338C217.904 327.332 218.057 327.324 218.21 327.315C218.213 327.315 218.219 327.315 218.222 327.315C221.333 327.122 223.648 326.243 225.429 324.9C229.264 322.022 230.633 317.031 232.193 312.135C234.315 305.525 236.789 299.094 246.084 298.286C246.832 298.223 247.625 298.194 248.464 298.206C248.708 298.209 248.954 298.214 249.207 298.223C252.567 298.111 255.032 297.225 256.91 295.828C260.473 293.192 261.915 288.733 263.343 284.204C265.527 277.327 267.683 270.289 277.081 269.226C277.118 269.223 277.159 269.22 277.196 269.214C277.315 269.203 277.43 269.188 277.552 269.18C277.621 269.174 277.692 269.168 277.764 269.162C277.855 269.157 277.945 269.148 278.039 269.142C278.082 269.142 278.129 269.137 278.173 269.134C278.956 269.088 279.783 269.076 280.663 269.108C280.828 269.108 280.993 269.108 281.156 269.108C287.967 269.019 292.029 265.014 293.352 260.25C294.453 256.32 293.682 251.872 291.04 248.684C288.906 246.096 285.545 244.337 280.965 244.354C278.394 244.4 276.345 244.9 274.678 245.743C274.582 245.792 274.485 245.843 274.388 245.895C274.388 245.895 274.382 245.895 274.382 245.898C269.961 248.299 268.335 253.166 266.747 258.154C264.467 265.29 262.261 272.67 252.083 273.423C251.278 273.484 250.42 273.501 249.509 273.472C241.475 273.63 235.984 278.745 235.828 286.223V286.228C234.387 291.932 232.162 295.957 229.507 298.637C224.59 302.107 217.626 302.99 211.651 301.299C206.051 298.778 201.318 293.764 199.711 288.356C199.611 287.588 199.564 286.789 199.571 285.958C199.53 281.557 201.368 277.514 204.391 274.493C207.28 272.233 211.483 270.35 217.289 269.108H217.345C222.656 269.168 226.403 267.003 228.577 263.93C230.821 260.77 231.395 256.65 230.296 253.008C228.867 248.238 224.581 244.279 217.423 244.357C211.679 244.23 206.594 241.666 203.337 237.765C198.647 231.419 198.981 221.955 204.379 216.11C208.063 213.385 213.317 212.266 218.194 210.863C223.532 210.673 227.183 208.175 229.139 204.831C230.312 203.219 231.03 201.177 231.105 198.529C231.048 195.913 230.362 193.883 229.229 192.271C227.314 188.892 223.682 186.354 218.337 186.135C213.445 184.704 208.154 183.582 204.435 180.868C198.513 174.477 198.61 163.765 204.706 157.535C210.974 152.147 221.61 151.627 228.68 156.008C232.97 159.001 235.747 163.73 235.838 169.133C235.806 173.724 237.909 177.036 240.948 179.066C243.213 180.75 246.081 181.748 249.238 181.754C252.18 181.679 254.43 180.995 256.202 179.879C259.771 178.08 262.429 174.745 262.629 169.866C264.07 165.556 265.212 160.924 267.892 157.546C271.54 155.028 276.563 153.958 281.243 152.624C286.563 152.44 290.207 149.965 292.172 146.644C293.358 145.023 294.091 142.967 294.172 140.282C294.11 137.631 293.405 135.587 292.244 133.963C290.319 130.631 286.712 128.126 281.421 127.899C277.627 126.79 273.59 125.867 270.229 124.242C267.387 122.658 265.387 120.81 264.089 118.82C262.991 116.805 262.436 114.252 262.641 110.943C262.638 110.04 262.701 109.172 262.822 108.344C264.479 103.056 269.128 98.1919 274.622 95.7021C280.597 93.9743 287.583 94.8224 292.522 98.2724C295.227 100.975 297.476 105.072 298.899 110.905C298.958 114.579 300.559 117.822 303.117 120.102C305.501 122.227 308.718 123.512 312.306 123.518C317.26 123.544 320.814 121.531 322.954 118.645C324.639 116.615 325.659 114.096 325.7 111.377C325.747 108.116 324.567 105.236 322.514 103.051C320.312 100.449 316.836 98.695 312.081 98.7669H312.078C301.838 98.6979 296.091 92.1745 294.88 84.9037C294.107 80.1944 295.227 75.1747 298.241 71.3912C301.133 67.7773 305.769 65.2933 312.159 65.2847C312.221 65.2847 312.281 65.2789 312.343 65.276C319.713 65.0892 325.116 60.2822 325.662 53.5374C327.101 49.2134 328.199 44.5473 330.895 41.1375C334.557 38.5989 339.628 37.515 344.342 36.158C349.655 36.0172 353.277 33.5332 355.221 30.1895C356.441 28.5307 357.184 26.4204 357.24 23.6547C357.249 19.7878 355.664 16.8582 353.259 14.8687L353.234 14.8572ZM202.251 89.2794C202.235 89.3168 202.216 89.3542 202.198 89.3915C202.16 89.472 202.123 89.5554 202.082 89.6359C202.048 89.7078 202.014 89.7768 201.979 89.8458C201.954 89.8947 201.933 89.9435 201.908 89.9895C201.851 90.0988 201.795 90.2052 201.736 90.3144C201.733 90.323 201.727 90.3317 201.723 90.3403C200.279 93.0083 198.079 95.2968 195.131 96.809C195.122 96.8148 195.112 96.8177 195.103 96.8234C194.987 96.8838 194.869 96.9413 194.75 96.9959C194.738 97.0016 194.725 97.0074 194.713 97.016C194.585 97.0764 194.457 97.1368 194.326 97.1943C194.323 97.1943 194.32 97.1972 194.313 97.2C194.201 97.2489 194.086 97.2978 193.973 97.3467C193.952 97.3553 193.93 97.3668 193.905 97.3754C193.802 97.4185 193.696 97.4588 193.59 97.5019C193.555 97.5134 193.524 97.5278 193.49 97.5422C193.399 97.5767 193.309 97.6083 193.215 97.6428C193.165 97.66 193.115 97.6802 193.065 97.6974C192.975 97.729 192.885 97.7578 192.794 97.7894C192.741 97.8067 192.688 97.8268 192.632 97.844C192.544 97.8728 192.457 97.8987 192.37 97.9245C192.31 97.9418 192.251 97.9619 192.189 97.9792C192.108 98.0022 192.023 98.0252 191.942 98.0482C191.874 98.0683 191.808 98.0855 191.739 98.1057C191.649 98.1287 191.555 98.1517 191.462 98.1747C191.403 98.189 191.34 98.2063 191.281 98.2207C191.193 98.2408 191.103 98.2609 191.013 98.281C190.947 98.2954 190.878 98.3098 190.813 98.3242C190.729 98.3414 190.641 98.3587 190.554 98.373C190.482 98.3874 190.41 98.4018 190.335 98.4162C190.242 98.4334 190.148 98.4478 190.052 98.465C189.983 98.4765 189.917 98.488 189.849 98.4995C189.752 98.5139 189.655 98.5283 189.559 98.5427C189.49 98.5513 189.424 98.5628 189.356 98.5714C189.247 98.5858 189.134 98.5973 189.022 98.6117C188.966 98.6174 188.91 98.626 188.853 98.6318C188.732 98.6461 188.607 98.6548 188.482 98.6663C188.435 98.6692 188.389 98.6749 188.342 98.6807C188.208 98.6922 188.073 98.7008 187.936 98.7094C187.899 98.7094 187.861 98.7152 187.824 98.718C187.674 98.7267 187.521 98.7324 187.368 98.7382C187.343 98.7382 187.322 98.7382 187.297 98.741C187.119 98.7468 186.941 98.7497 186.76 98.7525C186.579 98.7525 186.395 98.7525 186.211 98.7525C186.192 98.7525 186.177 98.7525 186.158 98.7525C185.992 98.7525 185.83 98.7525 185.668 98.7525C185.627 98.7525 185.584 98.7525 185.543 98.7525C185.406 98.7525 185.269 98.7468 185.131 98.7439C185.088 98.7439 185.044 98.741 185 98.7382C184.866 98.7324 184.735 98.7267 184.604 98.7209C184.548 98.718 184.492 98.7123 184.432 98.7094C184.314 98.7037 184.198 98.695 184.083 98.6864C184.021 98.6807 183.958 98.6749 183.896 98.6692C183.787 98.6605 183.681 98.6519 183.571 98.6404C183.509 98.6347 183.443 98.626 183.381 98.6174C183.278 98.6059 183.172 98.5944 183.069 98.58C183 98.5714 182.935 98.5599 182.866 98.5513C182.769 98.5369 182.67 98.5254 182.573 98.511C182.504 98.4995 182.436 98.488 182.367 98.4765C182.273 98.4622 182.18 98.4478 182.086 98.4305C182.021 98.419 181.955 98.4047 181.89 98.3932C181.796 98.3759 181.702 98.3587 181.609 98.3385C181.546 98.327 181.487 98.3127 181.425 98.2983C181.328 98.2782 181.231 98.258 181.138 98.235C181.094 98.2235 181.05 98.212 181.01 98.2034C180.901 98.1775 180.788 98.1488 180.679 98.12C180.642 98.1114 180.604 98.0999 180.567 98.0884C180.454 98.0568 180.339 98.028 180.227 97.9935C180.195 97.9849 180.164 97.9734 180.133 97.9648C180.015 97.9303 179.899 97.8958 179.784 97.8584C179.768 97.8527 179.749 97.8469 179.731 97.8411C179.603 97.798 179.475 97.7578 179.347 97.7118C174.898 96.1622 171.818 93.0399 170.112 89.3197C170.093 89.2794 170.074 89.2392 170.059 89.1989C170.024 89.1184 169.987 89.0408 169.953 88.9603C169.912 88.8625 169.871 88.7648 169.831 88.667C169.821 88.644 169.812 88.6182 169.8 88.5952C165.809 78.6822 171.222 65.1122 186.152 65.2818C201.433 65.0259 206.778 79.2974 202.257 89.288L202.251 89.2794ZM202.401 321.878C202.401 321.878 202.394 321.893 202.391 321.901C202.344 322.016 202.294 322.129 202.241 322.241C202.226 322.278 202.207 322.313 202.191 322.35C202.154 322.433 202.113 322.517 202.076 322.6C202.051 322.652 202.023 322.704 201.998 322.758C201.967 322.824 201.933 322.89 201.898 322.957C201.858 323.034 201.817 323.112 201.777 323.189C201.755 323.23 201.736 323.27 201.714 323.307C200.263 325.978 198.057 328.267 195.1 329.779C195.097 329.779 195.09 329.785 195.087 329.785C194.966 329.848 194.841 329.908 194.716 329.969C194.71 329.972 194.703 329.974 194.697 329.977C194.585 330.029 194.473 330.081 194.36 330.133C194.338 330.141 194.317 330.153 194.295 330.161C194.189 330.21 194.079 330.256 193.97 330.299C193.942 330.311 193.917 330.322 193.889 330.334C193.792 330.374 193.696 330.411 193.599 330.449C193.558 330.466 193.515 330.483 193.474 330.498C193.381 330.532 193.284 330.567 193.187 330.601C193.14 330.618 193.097 330.636 193.05 330.65C192.963 330.682 192.872 330.71 192.785 330.739C192.729 330.759 192.672 330.777 192.616 330.797C192.538 330.823 192.457 330.846 192.379 330.869C192.31 330.889 192.242 330.912 192.173 330.932C192.101 330.952 192.027 330.972 191.955 330.992C191.877 331.012 191.802 331.035 191.724 331.055C191.655 331.073 191.587 331.09 191.521 331.107C191.437 331.127 191.353 331.15 191.265 331.17C191.187 331.188 191.109 331.205 191.031 331.222C190.953 331.239 190.875 331.257 190.797 331.274C190.716 331.291 190.632 331.306 190.548 331.323C190.473 331.337 190.395 331.354 190.32 331.369C190.248 331.383 190.173 331.392 190.101 331.406C190.014 331.421 189.924 331.438 189.836 331.452C189.761 331.464 189.687 331.472 189.612 331.484C189.524 331.495 189.434 331.51 189.343 331.521C189.247 331.533 189.15 331.544 189.053 331.556C188.985 331.564 188.913 331.573 188.841 331.582C188.732 331.593 188.619 331.602 188.51 331.613C188.451 331.619 188.392 331.625 188.332 331.63C188.214 331.639 188.092 331.648 187.971 331.656C187.917 331.659 187.864 331.665 187.811 331.668C187.674 331.676 187.537 331.682 187.396 331.685C187.359 331.685 187.322 331.688 187.284 331.691C187.122 331.697 186.957 331.699 186.791 331.702C186.776 331.702 186.763 331.702 186.747 331.702C186.567 331.702 186.382 331.702 186.198 331.702H186.186C186.008 331.702 185.83 331.702 185.652 331.702C185.618 331.702 185.587 331.702 185.553 331.702C185.406 331.702 185.259 331.697 185.116 331.694C185.063 331.694 185.01 331.688 184.957 331.685C184.835 331.679 184.71 331.676 184.588 331.668C184.529 331.665 184.473 331.659 184.414 331.656C184.298 331.648 184.183 331.642 184.067 331.63C184.008 331.625 183.952 331.619 183.893 331.613C183.78 331.602 183.668 331.593 183.559 331.582C183.484 331.573 183.412 331.564 183.337 331.556C183.244 331.544 183.15 331.536 183.057 331.521C182.988 331.513 182.919 331.501 182.851 331.492C182.754 331.478 182.657 331.467 182.56 331.452C182.501 331.444 182.442 331.432 182.383 331.421C182.28 331.403 182.177 331.386 182.074 331.369C182.024 331.36 181.974 331.349 181.921 331.34C181.812 331.32 181.702 331.297 181.596 331.277C181.55 331.268 181.503 331.257 181.456 331.245C181.347 331.222 181.234 331.199 181.128 331.173C181.091 331.165 181.057 331.156 181.019 331.147C180.904 331.119 180.785 331.09 180.67 331.061C180.62 331.047 180.573 331.035 180.523 331.021C180.42 330.992 180.317 330.966 180.217 330.938C180.18 330.926 180.142 330.915 180.105 330.903C179.996 330.871 179.883 330.837 179.774 330.802C179.752 330.797 179.731 330.788 179.709 330.779C175.06 329.27 171.862 326.076 170.115 322.249C170.096 322.209 170.08 322.169 170.062 322.131C170.027 322.051 169.99 321.97 169.956 321.89C169.912 321.789 169.871 321.686 169.828 321.582C169.821 321.562 169.812 321.545 169.803 321.525C165.825 311.606 171.257 298.048 186.189 298.229C201.28 297.99 206.662 311.925 202.419 321.893L202.401 321.878ZM202.22 205.809C202.198 205.855 202.176 205.901 202.154 205.95C202.12 206.022 202.085 206.096 202.051 206.168C202.017 206.24 201.979 206.312 201.945 206.381C201.923 206.427 201.898 206.476 201.876 206.522C201.823 206.625 201.767 206.732 201.711 206.835C201.705 206.847 201.699 206.858 201.692 206.873C200.176 209.647 197.845 212.005 194.7 213.502C194.685 213.511 194.666 213.52 194.65 213.528C194.544 213.577 194.438 213.626 194.329 213.675C194.304 213.686 194.276 213.698 194.251 213.712C194.142 213.761 194.03 213.807 193.917 213.853C193.892 213.865 193.867 213.873 193.842 213.885C193.749 213.922 193.652 213.96 193.555 213.997C193.512 214.014 193.468 214.031 193.424 214.049C193.349 214.077 193.268 214.103 193.193 214.132C193.128 214.155 193.065 214.178 193 214.201C192.925 214.227 192.847 214.253 192.769 214.279C192.704 214.302 192.635 214.325 192.566 214.345C192.488 214.371 192.41 214.394 192.329 214.417C192.261 214.437 192.192 214.46 192.123 214.48C192.055 214.5 191.983 214.517 191.914 214.537C191.833 214.56 191.755 214.583 191.671 214.604C191.605 214.621 191.54 214.635 191.477 214.652C191.39 214.675 191.303 214.696 191.212 214.719C191.156 214.733 191.097 214.744 191.041 214.756C190.941 214.779 190.844 214.802 190.744 214.822C190.697 214.831 190.647 214.839 190.601 214.851C190.491 214.871 190.379 214.894 190.267 214.914C190.211 214.923 190.151 214.934 190.092 214.943C189.989 214.96 189.886 214.977 189.78 214.995C189.705 215.006 189.63 215.015 189.559 215.026C189.468 215.041 189.378 215.052 189.287 215.064C189.203 215.075 189.119 215.084 189.034 215.092C188.95 215.101 188.869 215.112 188.785 215.121C188.701 215.13 188.613 215.138 188.526 215.144C188.442 215.153 188.361 215.161 188.276 215.167C188.167 215.176 188.055 215.181 187.942 215.187C187.88 215.19 187.818 215.196 187.755 215.199C187.634 215.204 187.512 215.21 187.39 215.213C187.337 215.213 187.281 215.219 187.228 215.222C187.091 215.225 186.95 215.227 186.813 215.23C186.772 215.23 186.732 215.23 186.691 215.23C186.52 215.23 186.348 215.23 186.173 215.23C186.164 215.23 186.155 215.23 186.145 215.23C185.961 215.23 185.78 215.23 185.599 215.23C185.59 215.23 185.577 215.23 185.568 215.23C185.4 215.23 185.231 215.225 185.063 215.216C185.035 215.216 185.007 215.213 184.978 215.213C184.829 215.207 184.679 215.199 184.532 215.19C184.51 215.19 184.489 215.187 184.467 215.184C184.314 215.176 184.161 215.164 184.011 215.15C183.983 215.15 183.955 215.144 183.927 215.141C183.783 215.13 183.64 215.115 183.5 215.101C183.465 215.098 183.434 215.092 183.4 215.089C183.266 215.075 183.128 215.058 182.997 215.041C182.944 215.035 182.891 215.026 182.835 215.018C182.723 215 182.613 214.986 182.501 214.969C182.442 214.96 182.386 214.949 182.326 214.94C182.223 214.923 182.117 214.905 182.014 214.885C181.971 214.877 181.93 214.868 181.887 214.859C181.771 214.836 181.653 214.813 181.537 214.79C181.506 214.785 181.478 214.776 181.447 214.77C181.322 214.744 181.194 214.716 181.069 214.684C181.041 214.678 181.013 214.67 180.985 214.664C180.86 214.632 180.732 214.604 180.61 214.569C180.589 214.563 180.567 214.558 180.545 214.552C180.414 214.517 180.286 214.48 180.158 214.443C180.146 214.44 180.133 214.434 180.124 214.431C179.986 214.391 179.849 214.348 179.715 214.305C179.712 214.305 179.706 214.305 179.703 214.302C175.179 212.833 172.024 209.774 170.249 206.088C170.24 206.068 170.23 206.048 170.221 206.025C170.174 205.927 170.127 205.826 170.084 205.728C170.065 205.685 170.043 205.639 170.024 205.593C169.99 205.519 169.956 205.444 169.924 205.366C169.884 205.268 169.843 205.168 169.803 205.067C169.793 205.044 169.784 205.021 169.775 205.001C165.828 195.077 171.297 181.535 186.236 181.751C201.496 181.538 206.79 195.838 202.232 205.818L202.22 205.809Z"
            fill={color}
        />
        <path
            d="M72.6241 107.378C72.6148 107.352 72.6085 107.326 72.6023 107.303C72.5648 107.179 72.5274 107.059 72.4868 106.938C72.4525 106.837 72.4182 106.737 72.3808 106.639C72.362 106.59 72.3464 106.541 72.3277 106.492C71.685 104.779 70.6554 103.206 69.2389 101.93C69.2296 101.921 69.2202 101.912 69.2108 101.904C69.0923 101.797 68.9706 101.694 68.8458 101.59C68.8052 101.556 68.7616 101.521 68.7179 101.487C68.6243 101.415 68.5307 101.34 68.4371 101.271C68.356 101.211 68.278 101.153 68.1968 101.096C68.1344 101.053 68.072 101.01 68.0096 100.967C67.888 100.886 67.7694 100.806 67.6446 100.728C67.6165 100.711 67.5884 100.693 67.5603 100.676C67.3981 100.578 67.2327 100.481 67.0643 100.389C67.0643 100.389 67.058 100.389 67.058 100.386C65.6353 99.6066 63.9661 99.0661 62.0411 98.8534C62.0192 98.8534 61.9974 98.8476 61.9756 98.8448C59.4296 98.6435 57.3424 98.8591 55.6076 99.3968C48.9714 101.429 47.5112 108.128 45.4364 114.522C43.7173 119.743 41.5926 124.76 35.9516 126.87C33.8082 127.667 31.1531 128.046 27.824 127.868C27.7336 127.862 27.6462 127.859 27.5557 127.854C24.3359 127.856 21.818 127.29 19.8119 126.307C13.756 123.311 12.3582 116.471 10.3021 110.362C8.78891 105.791 6.90443 101.631 2.36795 99.7964C1.65035 99.506 0.864111 99.276 0.00299072 99.1093V123.716C2.72987 124.053 5.08859 124.895 7.06355 126.114C8.71403 127.132 10.1024 128.408 11.2194 129.857C12.6546 131.715 13.6468 133.859 14.1928 136.111C15.3971 141.081 14.4174 146.581 11.1788 150.693C8.74211 153.786 5.02619 156.089 0.00611072 156.802V181.306C1.84691 180.871 3.49739 180.181 4.90763 179.273C8.27723 177.099 10.2959 173.678 10.3739 169.532C10.3739 169.532 10.3739 169.529 10.3739 169.527C10.0213 161.773 13.6031 158.176 18.4703 155.98C21.4499 154.643 24.9068 153.82 28.239 152.892C30.8473 152.167 33.3776 151.377 35.5429 150.218C38.9063 148.424 41.3773 145.756 41.8672 141.104C41.8796 141.001 41.889 140.897 41.9015 140.791C42.2634 130.473 49.3115 123.892 60.4093 123.509C70.5743 123.412 74.7239 114.488 72.6272 107.381L72.6241 107.378Z"
            fill={color}
        />
        <path
            d="M7.40034 -13.1684C5.71554 -15.2671 3.23826 -16.8484 -0.000305176 -17.4263V6.7611C0.907615 6.57998 1.75314 6.32986 2.53626 6.01361C3.5721 5.76923 4.67346 5.3006 5.79666 4.0816C8.6733 1.6896 10.0898 -1.83227 10.0867 -5.3484C10.1709 -5.6589 10.2583 -5.97802 10.3425 -6.30865C10.1896 -8.88752 9.10074 -11.2623 7.40346 -13.1713L7.40034 -13.1684Z"
            fill={color}
        />
        <path
            d="M10.3363 284.872C10.1834 282.298 9.10074 279.927 7.4097 278.023C5.7249 275.919 3.2445 274.335 -0.000305176 273.754V297.941C3.2133 297.303 5.65002 295.756 7.32234 293.732C9.44394 291.429 10.5453 288.382 10.3394 284.874L10.3363 284.872Z"
            fill={color}
        />
        <path
            d="M624 215.645C620.858 216.355 618.465 218.051 616.861 220.233C615.37 222.113 614.409 224.413 614.216 226.929C614.3 227.222 614.387 227.51 614.471 227.791C614.512 231.31 616.007 234.818 619.052 237.175C620.212 238.363 621.317 238.78 622.331 239.001C622.858 239.202 623.417 239.375 624 239.521V215.645Z"
            fill={color}
        />
        <path
            d="M624 99.1722C620.858 99.8824 618.465 101.576 616.861 103.758C615.37 105.638 614.409 107.938 614.216 110.454C614.3 110.747 614.387 111.035 614.471 111.313C614.512 114.83 616.003 118.334 619.045 120.692C620.206 121.885 621.314 122.302 622.328 122.52C622.855 122.721 623.417 122.894 623.997 123.043V99.1665L624 99.1722Z"
            fill={color}
        />
        <path
            d="M457.745 144.822C457.776 144.908 457.81 144.991 457.844 145.075C457.863 145.121 457.882 145.167 457.901 145.213C457.919 145.256 457.935 145.299 457.954 145.342C457.979 145.402 458.007 145.463 458.032 145.52C458.044 145.549 458.057 145.578 458.069 145.607C459.239 148.174 461.295 150.362 464.231 151.581C464.237 151.581 464.24 151.584 464.243 151.587C464.337 151.624 464.431 151.661 464.524 151.699C464.534 151.702 464.543 151.704 464.549 151.707C464.637 151.742 464.724 151.773 464.814 151.805C464.83 151.811 464.846 151.817 464.861 151.822C464.933 151.848 465.005 151.871 465.08 151.897C465.114 151.909 465.148 151.92 465.183 151.932C465.248 151.952 465.314 151.972 465.379 151.992C465.423 152.006 465.467 152.021 465.51 152.032C465.582 152.052 465.654 152.072 465.722 152.093C465.763 152.104 465.8 152.116 465.841 152.127C465.903 152.144 465.969 152.159 466.031 152.176C466.081 152.187 466.128 152.202 466.178 152.213C466.237 152.228 466.3 152.242 466.362 152.254C466.415 152.265 466.471 152.279 466.524 152.291C466.584 152.302 466.646 152.314 466.705 152.328C466.761 152.34 466.818 152.351 466.877 152.363C466.93 152.371 466.986 152.38 467.039 152.391C467.105 152.403 467.17 152.414 467.232 152.426C467.286 152.435 467.339 152.44 467.392 152.449C467.46 152.458 467.529 152.469 467.597 152.478C467.651 152.484 467.707 152.489 467.76 152.498C467.828 152.506 467.897 152.515 467.966 152.524C468.025 152.53 468.084 152.535 468.143 152.541C468.209 152.547 468.275 152.555 468.343 152.561C468.412 152.567 468.484 152.57 468.552 152.576C468.608 152.578 468.668 152.584 468.727 152.587C468.799 152.59 468.867 152.593 468.939 152.599C468.998 152.599 469.058 152.604 469.117 152.607C469.195 152.607 469.276 152.61 469.357 152.613C469.41 152.613 469.46 152.616 469.513 152.619C469.601 152.619 469.691 152.619 469.781 152.619C469.825 152.619 469.869 152.619 469.916 152.619C470.324 152.624 470.721 152.619 471.111 152.596C471.123 152.596 471.132 152.596 471.145 152.596C471.263 152.59 471.379 152.581 471.494 152.573C471.497 152.573 471.501 152.573 471.504 152.573C471.629 152.564 471.75 152.552 471.872 152.538C471.903 152.538 471.934 152.532 471.965 152.527C472.059 152.518 472.153 152.506 472.243 152.495C472.274 152.492 472.309 152.486 472.34 152.481C472.43 152.469 472.521 152.458 472.608 152.443C472.646 152.438 472.683 152.432 472.721 152.423C472.802 152.412 472.886 152.397 472.967 152.383C473.004 152.377 473.042 152.368 473.082 152.36C473.164 152.345 473.242 152.331 473.323 152.314C473.351 152.308 473.376 152.302 473.404 152.297C473.491 152.279 473.582 152.259 473.669 152.239C473.713 152.228 473.76 152.216 473.803 152.205C473.872 152.187 473.94 152.173 474.009 152.153C474.047 152.144 474.084 152.133 474.121 152.121C474.196 152.101 474.271 152.081 474.343 152.061C474.377 152.052 474.412 152.041 474.443 152.029C474.518 152.006 474.596 151.983 474.671 151.96C474.696 151.952 474.72 151.943 474.745 151.934C474.83 151.909 474.911 151.88 474.992 151.854C475.032 151.839 475.07 151.825 475.11 151.811C475.176 151.788 475.242 151.765 475.307 151.739C475.335 151.727 475.363 151.716 475.394 151.704C475.469 151.676 475.544 151.647 475.616 151.618C475.632 151.612 475.647 151.607 475.663 151.598C475.75 151.563 475.834 151.526 475.919 151.489C475.934 151.483 475.947 151.477 475.962 151.469C478.433 150.368 480.255 148.562 481.422 146.423C481.438 146.394 481.453 146.366 481.469 146.337C481.5 146.279 481.531 146.222 481.563 146.161C481.578 146.13 481.594 146.098 481.609 146.069C481.638 146.015 481.666 145.957 481.694 145.9C481.731 145.822 481.769 145.745 481.803 145.667C481.809 145.655 481.812 145.647 481.818 145.635C485.185 138.244 481.248 127.655 469.916 127.865C459.033 127.747 454.999 137.496 457.726 144.793C457.726 144.799 457.729 144.804 457.732 144.81L457.745 144.822Z"
            fill={color}
        />
        <path
            d="M243.432 216.602C243.432 216.602 243.413 216.608 243.407 216.613C243.319 216.648 243.232 216.682 243.148 216.717C243.114 216.731 243.076 216.746 243.042 216.76C242.982 216.786 242.923 216.809 242.864 216.835C242.801 216.861 242.742 216.889 242.68 216.915C242.649 216.93 242.614 216.944 242.583 216.958C242.518 216.987 242.452 217.019 242.387 217.05C242.358 217.062 242.33 217.076 242.305 217.088C240.836 217.804 239.519 218.77 238.462 219.983C238.265 220.207 238.078 220.443 237.9 220.687C237.9 220.687 237.897 220.69 237.894 220.693C237.834 220.771 237.778 220.851 237.722 220.932C237.722 220.932 237.719 220.937 237.716 220.94C237.669 221.009 237.622 221.081 237.576 221.153C237.566 221.167 237.557 221.182 237.547 221.196C237.507 221.256 237.469 221.32 237.432 221.38C237.416 221.406 237.401 221.429 237.385 221.455C237.351 221.512 237.317 221.57 237.285 221.627C237.267 221.659 237.248 221.688 237.229 221.719C237.201 221.768 237.176 221.817 237.148 221.869C237.126 221.909 237.104 221.949 237.083 221.992C237.061 222.033 237.042 222.076 237.02 222.116C236.995 222.168 236.967 222.217 236.942 222.268C236.92 222.312 236.902 222.355 236.883 222.395C236.858 222.447 236.833 222.498 236.811 222.55C236.796 222.588 236.78 222.625 236.761 222.662C236.736 222.72 236.711 222.78 236.686 222.838C236.677 222.861 236.668 222.887 236.658 222.91C236.627 222.981 236.599 223.056 236.571 223.131C236.562 223.157 236.552 223.183 236.543 223.209C236.515 223.283 236.49 223.355 236.462 223.43C236.452 223.456 236.443 223.485 236.437 223.51C236.412 223.585 236.387 223.66 236.362 223.738C236.356 223.763 236.346 223.786 236.34 223.812C236.315 223.893 236.29 223.97 236.268 224.051C236.265 224.062 236.262 224.077 236.259 224.088C236.234 224.18 236.209 224.275 236.184 224.367C236.178 224.387 236.175 224.407 236.168 224.428C236.147 224.514 236.128 224.603 236.106 224.692C236.103 224.709 236.1 224.727 236.097 224.744C236.078 224.836 236.059 224.928 236.04 225.02C236.034 225.049 236.031 225.077 236.025 225.106C236.009 225.189 235.997 225.27 235.981 225.353C235.978 225.382 235.972 225.414 235.969 225.445C235.956 225.529 235.944 225.612 235.934 225.695C235.928 225.739 235.925 225.779 235.919 225.822C235.909 225.894 235.9 225.969 235.894 226.043C235.888 226.109 235.881 226.176 235.875 226.242C235.872 226.293 235.866 226.342 235.863 226.394C235.859 226.463 235.856 226.532 235.85 226.598C235.85 226.65 235.844 226.702 235.841 226.753C235.838 226.831 235.835 226.909 235.835 226.983C235.835 227.027 235.835 227.073 235.831 227.116C235.831 227.216 235.831 227.32 235.831 227.423C235.831 227.443 235.831 227.464 235.831 227.484C235.828 227.734 235.831 227.984 235.838 228.228C235.847 228.47 235.863 228.711 235.884 228.944C235.884 228.964 235.888 228.984 235.891 229.007C235.9 229.105 235.909 229.2 235.922 229.295C235.922 229.306 235.922 229.321 235.928 229.332C235.941 229.436 235.953 229.536 235.969 229.64C235.969 229.651 235.972 229.663 235.975 229.674C235.991 229.775 236.006 229.879 236.025 229.979C236.025 229.994 236.031 230.008 236.034 230.022C236.053 230.12 236.072 230.218 236.09 230.313C236.09 230.321 236.093 230.327 236.097 230.336C236.118 230.436 236.14 230.54 236.165 230.638V230.643C236.19 230.75 236.218 230.853 236.246 230.957C236.246 230.962 236.249 230.968 236.253 230.977C236.309 231.181 236.371 231.385 236.437 231.583C236.437 231.583 236.437 231.586 236.437 231.589C237.576 234.959 240.203 237.267 243.376 238.512H243.382C243.475 238.55 243.569 238.584 243.663 238.619C243.722 238.639 243.778 238.659 243.837 238.682C243.878 238.696 243.915 238.711 243.956 238.722C251.903 241.465 262.791 237.776 262.632 227.541C262.832 217.151 251.435 213.5 243.441 216.567L243.432 216.602Z"
            fill={color}
        />
        <path
            d="M495.668 158.374C495.668 158.374 495.653 158.38 495.643 158.383C495.556 158.417 495.465 158.452 495.378 158.489C495.337 158.506 495.297 158.524 495.253 158.541C495.2 158.564 495.147 158.584 495.094 158.607C495.019 158.642 494.941 158.673 494.866 158.708C494.848 158.716 494.832 158.722 494.813 158.731C494.729 158.768 494.645 158.808 494.561 158.849C494.551 158.851 494.542 158.857 494.536 158.86C492.239 159.981 490.317 161.715 489.182 164.052C489.182 164.058 489.175 164.064 489.172 164.07C489.132 164.156 489.091 164.242 489.051 164.328C489.047 164.337 489.044 164.346 489.038 164.354C488.998 164.443 488.96 164.532 488.923 164.622C488.92 164.63 488.916 164.636 488.913 164.645C488.838 164.826 488.77 165.013 488.704 165.199C488.698 165.214 488.695 165.228 488.689 165.243C488.664 165.32 488.639 165.398 488.614 165.475C488.608 165.501 488.598 165.524 488.589 165.55C488.558 165.651 488.53 165.751 488.501 165.852C488.501 165.855 488.501 165.861 488.498 165.864C488.473 165.958 488.448 166.053 488.423 166.151C488.42 166.163 488.417 166.174 488.414 166.186C488.367 166.381 488.324 166.579 488.286 166.784C488.283 166.804 488.277 166.824 488.274 166.844C488.255 166.947 488.236 167.051 488.221 167.154C488.221 167.163 488.218 167.175 488.214 167.183C488.199 167.295 488.183 167.41 488.168 167.525C488.096 168.106 488.062 168.707 488.071 169.334C488.071 169.4 488.071 169.466 488.071 169.532C488.071 169.59 488.071 169.647 488.071 169.705C488.071 169.782 488.074 169.86 488.077 169.937C488.077 169.981 488.077 170.027 488.08 170.07C488.083 170.165 488.09 170.257 488.096 170.349C488.096 170.374 488.096 170.403 488.099 170.429C488.105 170.515 488.115 170.602 488.121 170.691C488.124 170.722 488.127 170.754 488.13 170.786C488.14 170.875 488.149 170.961 488.158 171.05C488.158 171.079 488.165 171.108 488.168 171.133C488.177 171.211 488.189 171.286 488.199 171.361C488.205 171.398 488.208 171.438 488.214 171.476C488.224 171.545 488.236 171.614 488.249 171.683C488.255 171.726 488.264 171.769 488.271 171.812C488.283 171.878 488.296 171.944 488.308 172.01C488.317 172.056 488.327 172.099 488.336 172.145C488.352 172.214 488.367 172.283 488.383 172.352C488.392 172.393 488.402 172.43 488.411 172.47C488.427 172.536 488.445 172.6 488.461 172.666C488.47 172.706 488.483 172.749 488.495 172.792C488.514 172.856 488.533 172.919 488.551 172.982C488.564 173.022 488.576 173.065 488.589 173.106C488.604 173.155 488.62 173.201 488.636 173.249C488.654 173.304 488.67 173.359 488.689 173.413C488.698 173.442 488.711 173.471 488.72 173.5C488.745 173.571 488.77 173.643 488.798 173.715C488.807 173.741 488.817 173.767 488.829 173.793C488.857 173.865 488.885 173.939 488.913 174.011C488.923 174.034 488.932 174.054 488.941 174.077C488.973 174.152 489.004 174.227 489.038 174.302C489.044 174.319 489.054 174.333 489.06 174.351C490.389 177.295 492.929 179.319 495.915 180.417C495.996 180.446 496.08 180.477 496.164 180.506C496.18 180.512 496.192 180.515 496.208 180.52C496.305 180.552 496.398 180.584 496.498 180.615C496.498 180.615 496.501 180.615 496.504 180.615C504.398 183.154 514.972 179.451 514.872 169.411C515.128 158.941 503.677 155.278 495.665 158.363L495.668 158.374Z"
            fill={color}
        />
        <path
            d="M27.8115 302.59C22.4389 302.743 18.8259 305.353 16.957 308.823C15.8869 310.404 15.213 312.382 15.0944 314.912C15.0383 318.765 16.5795 321.7 18.9507 323.716C21.1035 325.901 24.2516 327.338 28.3887 327.332C31.2154 327.249 33.415 326.622 35.1622 325.605C38.9125 323.88 41.7267 320.542 41.889 315.562C43.3554 311.215 44.4786 306.523 47.1898 303.113C50.8964 300.595 56.0038 299.557 60.7275 298.191C67.8973 297.777 73.4228 292.456 73.4259 285.835C73.5694 277.563 66.4278 273.544 59.4826 273.78C56.425 273.88 53.408 274.809 51.0649 276.563C48.4004 278.555 46.6064 281.611 46.622 285.734C46.622 285.743 46.622 285.751 46.622 285.76C46.5034 290.573 44.541 294.73 41.2993 297.708C37.599 300.207 32.5165 301.233 27.8084 302.587L27.8115 302.59Z"
            fill={color}
        />
        <path
            d="M520.734 29.0509C522.057 31.7621 524.425 33.6624 527.205 34.7406C527.239 34.7521 527.274 34.7664 527.305 34.7779C527.367 34.8009 527.43 34.8268 527.495 34.8498C527.57 34.8786 527.648 34.9044 527.726 34.9303C527.748 34.9361 527.767 34.9447 527.785 34.9504C535.716 37.6558 546.54 33.9614 546.409 23.7868C546.633 13.3247 535.167 9.69067 527.161 12.7985C527.133 12.81 527.108 12.8215 527.08 12.8302C527.012 12.856 526.943 12.8848 526.874 12.9136C526.849 12.9222 526.827 12.9337 526.803 12.9423C526.731 12.9739 526.659 13.0027 526.59 13.0343C526.534 13.0602 526.478 13.0832 526.425 13.1091C526.388 13.1263 526.347 13.1435 526.31 13.1608C523.988 14.2389 522.026 15.9265 520.837 18.2208C520.834 18.2265 520.831 18.2352 520.825 18.2409C520.787 18.3157 520.75 18.3904 520.715 18.4623C520.706 18.4824 520.697 18.4997 520.687 18.5198C520.65 18.5974 520.612 18.6779 520.578 18.7584C520.572 18.7728 520.563 18.7872 520.556 18.8044C520.525 18.8734 520.494 18.9453 520.466 19.0172C520.453 19.043 520.444 19.0689 520.432 19.0948C520.407 19.1552 520.382 19.2184 520.36 19.2788C520.344 19.3162 520.329 19.3535 520.316 19.3909C520.288 19.4685 520.26 19.5462 520.235 19.6238C520.226 19.6468 520.219 19.6698 520.21 19.6928C520.185 19.7647 520.16 19.8423 520.138 19.917C520.129 19.9458 520.12 19.9745 520.11 20.0033C520.091 20.0665 520.073 20.1327 520.054 20.1959C520.041 20.2362 520.029 20.2764 520.02 20.3167C520.001 20.3828 519.985 20.4518 519.97 20.5179C519.96 20.5582 519.948 20.5955 519.939 20.6358C519.923 20.7019 519.907 20.7681 519.895 20.8342C519.885 20.8773 519.876 20.9204 519.867 20.9607C519.851 21.0354 519.836 21.1102 519.823 21.1878C519.817 21.2223 519.811 21.2568 519.801 21.2913C519.786 21.3747 519.773 21.458 519.761 21.5443C519.758 21.573 519.751 21.6018 519.745 21.6306C519.733 21.7168 519.72 21.8059 519.711 21.8922C519.708 21.9209 519.705 21.9468 519.701 21.9755C519.683 22.1193 519.67 22.2659 519.658 22.4125C519.62 22.8553 519.605 23.3124 519.614 23.7811C519.614 23.8242 519.614 23.8673 519.614 23.9076C519.614 23.9881 519.614 24.0714 519.614 24.1519C519.614 24.2037 519.617 24.2526 519.617 24.3014C519.617 24.3733 519.62 24.4452 519.623 24.517C519.623 24.5832 519.63 24.6493 519.636 24.7154C519.636 24.7701 519.642 24.8218 519.645 24.8764C519.648 24.9425 519.658 25.0058 519.664 25.069C519.667 25.1208 519.673 25.1754 519.68 25.23C519.686 25.3077 519.698 25.3824 519.705 25.4572C519.711 25.4974 519.714 25.5377 519.72 25.5779C519.73 25.6527 519.742 25.7246 519.751 25.7993C519.758 25.8396 519.761 25.8798 519.77 25.9201C519.779 25.9833 519.792 26.0465 519.801 26.1098C519.811 26.1587 519.817 26.2075 519.826 26.2564C519.836 26.3139 519.848 26.3714 519.861 26.4289C519.87 26.4807 519.882 26.5353 519.892 26.5871C519.901 26.6359 519.914 26.6848 519.926 26.7337C519.942 26.7912 519.954 26.8516 519.967 26.9091C519.979 26.9579 519.992 27.0039 520.004 27.0528C520.02 27.1103 520.035 27.1707 520.051 27.2282C520.063 27.277 520.079 27.323 520.095 27.3719C520.11 27.4294 520.129 27.4869 520.144 27.5416C520.157 27.5818 520.173 27.6221 520.185 27.6652C520.207 27.7284 520.226 27.7888 520.247 27.8492C520.263 27.8894 520.275 27.9297 520.291 27.9728C520.313 28.0332 520.335 28.0936 520.357 28.1511C520.369 28.1827 520.382 28.2143 520.394 28.2459C520.419 28.3121 520.447 28.381 520.472 28.4443C520.478 28.4587 520.485 28.4702 520.491 28.4845C520.566 28.6657 520.647 28.8439 520.731 29.0193C520.731 29.0222 520.734 29.0279 520.737 29.0308L520.734 29.0509Z"
            fill={color}
        />
    </svg>
);
