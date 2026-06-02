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
