import React from "react";
import styled from "styled-components";
import { ignorePropsForDOMElement } from "utils/styledComponentsUtils";

export const PageContent = styled.div`
    width: 100%;
    max-width: ${({ theme }) => theme.layout.contentNarrow};
    margin-inline: auto;
`;

export const PageGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${({ theme }) => theme.spacing["3xl"]};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: minmax(0, 1fr);
    }
`;

export const FormActions = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: ${({ theme }) => theme.spacing.xl};
    margin-top: ${({ theme }) => theme.spacing["3xl"]};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        flex-direction: column;
    }
`;

export const LayoutGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: ${({ theme }) => theme.layout.gutterDesktop};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: ${({ theme }) => theme.layout.gutterMobile};
    }
`;

export interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
    desktopSpan?: number;
    desktopStart?: number;
    mobileSpan?: number;
    mobileStart?: number;
}

export const GridItem = styled.div.withConfig(
    ignorePropsForDOMElement<GridItemProps>([
        "desktopSpan",
        "desktopStart",
        "mobileSpan",
        "mobileStart",
    ]),
)<GridItemProps>`
    min-width: 0;
    grid-column: ${({ desktopStart = 1, desktopSpan = 12 }) =>
        `${desktopStart} / span ${desktopSpan}`};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-column: ${({ mobileStart = 1, mobileSpan = 5 }) =>
            `${mobileStart} / span ${mobileSpan}`};
    }
`;

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
    gap?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
    align?: React.CSSProperties["alignItems"];
}

export const Stack = styled.div.withConfig(
    ignorePropsForDOMElement<StackProps>(["gap", "align"]),
)<StackProps>`
    display: flex;
    flex-direction: column;
    align-items: ${({ align }) => align ?? "stretch"};
    gap: ${({ gap = "xl", theme }) => theme.spacing[gap]};
`;

export interface InlineProps extends React.HTMLAttributes<HTMLDivElement> {
    gap?: "sm" | "md" | "lg" | "xl" | "2xl";
    align?: React.CSSProperties["alignItems"];
    justify?: React.CSSProperties["justifyContent"];
    wrap?: boolean;
}

export const Inline = styled.div.withConfig(
    ignorePropsForDOMElement<InlineProps>([
        "gap",
        "align",
        "justify",
        "wrap",
    ]),
)<InlineProps>`
    display: flex;
    align-items: ${({ align }) => align ?? "center"};
    justify-content: ${({ justify }) => justify ?? "flex-start"};
    flex-wrap: ${({ wrap }) => (wrap ? "wrap" : "nowrap")};
    gap: ${({ gap = "xl", theme }) => theme.spacing[gap]};
`;

export const VisuallyHidden = styled.span`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
`;

export type AlertTone = "info" | "success" | "warning" | "danger";

const AlertRoot = styled.div<{ $tone: AlertTone }>`
    display: flex;
    align-items: center;
    min-height: 64px;
    padding: ${({ theme }) => theme.spacing.xl};
    gap: ${({ theme }) => theme.spacing.lg};
    border: 1px solid
        ${({ $tone, theme }) => {
            if ($tone === "danger") return `${theme.danger}40`;
            if ($tone === "warning") return `${theme.warning}40`;
            if ($tone === "info") return `${theme.info}40`;
            return theme.primaryMuted;
        }};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ $tone, theme }) => {
        if ($tone === "danger") return `${theme.danger}1F`;
        if ($tone === "warning") return `${theme.warning}1F`;
        if ($tone === "info") return `${theme.info}1F`;
        return theme.primarySubtle;
    }};
    color: ${({ $tone, theme }) => {
            if ($tone === "danger") return theme.dangerText;
            if ($tone === "warning") return theme.warningText;
            if ($tone === "info") return theme.infoText;
            return theme.actionText;
    }};
    font-size: ${({ theme }) => theme.typography.size.md};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
`;

const AlertIcon = styled.span`
    flex-shrink: 0;
    font-size: 20px;
    line-height: 1;
`;

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    tone?: AlertTone;
    icon?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
    tone = "info",
    icon = "ℹ️",
    children,
    role,
    ...props
}) => (
    <AlertRoot
        {...props}
        $tone={tone}
        role={role ?? (tone === "danger" ? "alert" : "status")}
    >
        {icon && <AlertIcon aria-hidden="true">{icon}</AlertIcon>}
        <span>{children}</span>
    </AlertRoot>
);
