const foundations = {
    typography: {
        fontFamily:
            '"Roboto Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
        controlFontFamily: '"Roboto", "Inter", Arial, sans-serif',
        weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
        size: {
            xs: "12px",
            sm: "14px",
            md: "16px",
            lg: "18px",
            xl: "24px",
            display: "32px",
        },
        lineHeight: {
            xs: "16px",
            sm: "18px",
            md: "22px",
            lg: "24px",
            xl: "32px",
            display: "36px",
        },
    },
    spacing: {
        xxs: "2px",
        "2xs": "2px",
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
        "4xl": "32px",
        "5xl": "40px",
        "6xl": "48px",
    },
    radii: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        round: "999px",
    },
    sizes: {
        control: {
            small: "34px",
            medium: "40px",
            large: "48px",
            field: "44px",
        },
        iconButton: { small: "28px", medium: "34px", large: "40px" },
        checkbox: "16px",
        switch: { width: "48px", height: "24px", thumb: "18px" },
    },
    control: {
        labelGap: "6px",
        borderWidth: "1px",
        fieldPadding: "12px",
        buttonLineHeight: "132%",
        buttonPadding: {
            small: "8px 12px",
            medium: "10px 16px",
            large: "12px 20px",
        },
    },
    layout: {
        contentNarrow: "705px",
        contentWide: "1200px",
        gutterMobile: "16px",
        gutterDesktop: "24px",
        headerHeight: "48px",
        navigationHeight: "41px",
    },
    breakpoints: {
        mobile: "768px",
        laptop: "1024px",
        navigation: "1250px",
    },
    motion: {
        fast: "150ms",
        normal: "200ms",
        slow: "300ms",
        easing: "ease",
    },
    zIndices: { header: 100, drawer: 1000, modal: 1100, dropdown: 1200 },
};

// ASI Wallet Brand Guide v0.1 - Dark theme (default)
export const darkTheme = {
    ...foundations,
    mode: "dark",

    colors: {
        primary: "#93E27C",
        primaryDark: "#82C96D",
        secondary: "#33E4FF",
        danger: "#FF4D4F",
        success: "#93E27C",
        warning: "#FFB84D",
        info: "#33E4FF",
        error: "#FF4D4F",
        border: "#272B2E",
        borderLight: "rgba(255, 255, 255, 0.1)",

        background: {
            primary: "#0D1012",
            secondary: "#1B1F21",
            tertiary: "#272B2E",
        },

        text: {
            primary: "#F7F9FA",
            secondary: "#b8b8b8",
            tertiary: "#757575",
            inverse: "#0D1012",
        },
    },

    primary: "#93E27C",
    primaryDark: "#82C96D",
    secondary: "#33E4FF",
    danger: "#FF4D4F",
    success: "#93E27C",
    warning: "#FFB84D",
    info: "#33E4FF",

    background: "#0D1012",
    surface: "#1B1F21",
    card: "#1B1F21",

    text: {
        primary: "#F7F9FA",
        secondary: "#b8b8b8",
        tertiary: "#757575",
        inverse: "#0D1012",
    },

    actionText: "#93E27C",
    infoText: "#33E4FF",
    dangerText: "#FF4D4F",
    warningText: "#FFB84D",

    inputBg: "#272B2E",

    control: {
        ...foundations.control,
        fieldBackground: "#272B2E",
        fieldBorder: "#757575",
        radioBorder: "#757575",
        fieldHoverBorder: "#FFFFFF",
        disabledBackground: "#272B2E",
        disabledBorder: "#656565",
        neutralBorder: "#656565",
        neutralText: "#FFFFFF",
        toggleOff: "rgba(255, 255, 255, 0.1)",
        toggleThumb: "#FFFFFF",
    },

    border: "#272B2E",
    borderLight: "rgba(255, 255, 255, 0.1)",
    shadow: "0 1px 4px rgba(0, 0, 0, 0.32)",
    shadowLarge: "0 4px 12px rgba(0, 0, 0, 0.36)",
    shadowDrop: "0 4px 4px rgba(0, 0, 0, 0.25)",
    focusRing: "#93E27C",
    dangerFocusRing: "#FF4D4F",
    primarySubtle: "rgba(147, 226, 124, 0.12)",
    primaryMuted: "rgba(147, 226, 124, 0.25)",
    hoverSurface: "rgba(247, 249, 250, 0.06)",
    overlay: "rgba(13, 16, 18, 0.72)",

    error: "#FF4D4F",
    textSecondary: "#b8b8b8",
    textSecondaryAdditional: "#969797",

    fontSize: {
        xs: "12px",
        sm: "14px",
        base: "16px",
        lg: "18px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "30px",
        "4xl": "36px",
        logo: "17.658px",
    },

    gradient: {
        primary: "linear-gradient(135deg, #93E27C 0%, #82C96D 100%)",
        secondary: "linear-gradient(135deg, #33E4FF 0%, #00B8D4 100%)",
        dark: "linear-gradient(135deg, #1B1F21 0%, #0D1012 100%)",
    },
};

// Light theme - ASI Wallet Brand Guide v0.1
export const lightTheme = {
    ...foundations,
    mode: "light",

    colors: {
        primary: "#5A9C4F",
        primaryDark: "#4A8240",
        secondary: "#00A3CC",
        danger: "#E43A3C",
        success: "#5A9C4F",
        warning: "#f57c00",
        info: "#00A3CC",
        error: "#E43A3C",
        border: "#E0E4E6",
        borderLight: "rgba(0, 0, 0, 0.05)",

        background: {
            primary: "#F7F9FA",
            secondary: "#FFFFFF",
            tertiary: "#F0F2F3",
        },

        text: {
            primary: "#0D1012",
            secondary: "#5A5A5A",
            tertiary: "#757575",
            inverse: "#F7F9FA",
        },
    },

    primary: "#5A9C4F",
    primaryDark: "#4A8240",
    secondary: "#00A3CC",
    danger: "#E43A3C",
    success: "#5A9C4F",
    warning: "#f57c00",
    info: "#00A3CC",

    background: "#F7F9FA",
    surface: "#FFFFFF",
    card: "#FFFFFF",

    text: {
        primary: "#0D1012",
        secondary: "#5a5a5a",
        tertiary: "#757575",
        inverse: "#F7F9FA",
    },

    actionText: "#5A9C4F",
    infoText: "#00A3CC",
    dangerText: "#E43A3C",
    warningText: "#f57c00",

    inputBg: "#F0F2F3",

    control: {
        ...foundations.control,
        fieldBackground: "#F0F2F3",
        fieldBorder: "#8B8B8B",
        radioBorder: "#757575",
        fieldHoverBorder: "#131313",
        disabledBackground: "#F7F9FA",
        disabledBorder: "#C4C4C4",
        neutralBorder: "#969797",
        neutralText: "#131313",
        toggleOff: "#E5E5E5",
        toggleThumb: "#FFFFFF",
    },

    border: "#E0E4E6",
    borderLight: "rgba(0, 0, 0, 0.05)",
    shadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
    shadowLarge: "0 4px 12px rgba(0, 0, 0, 0.12)",
    shadowDrop: "0 4px 4px rgba(0, 0, 0, 0.25)",
    focusRing: "#5A9C4F",
    dangerFocusRing: "#E43A3C",
    primarySubtle: "rgba(90, 156, 79, 0.12)",
    primaryMuted: "rgba(90, 156, 79, 0.25)",
    hoverSurface: "rgba(13, 16, 18, 0.04)",
    overlay: "rgba(13, 16, 18, 0.64)",

    error: "#E43A3C",
    textSecondary: "#5a5a5a",
    textSecondaryAdditional: "#969797",

    fontSize: {
        xs: "12px",
        sm: "14px",
        base: "16px",
        lg: "18px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "30px",
        "4xl": "36px",
        logo: "17.658px",
    },

    gradient: {
        primary: "linear-gradient(135deg, #5A9C4F 0%, #4A8240 100%)",
        secondary: "linear-gradient(135deg, #00A3CC 0%, #33B8DB 100%)",
        dark: "linear-gradient(135deg, #FFFFFF 0%, #F7F9FA 100%)",
    },
};

export type Theme = typeof lightTheme;
