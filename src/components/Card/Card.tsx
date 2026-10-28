import styled, { css } from "styled-components";
import { ignorePropsForDOMElement } from "utils/styledComponentsUtils";

export interface CardProps {
    noPadding?: boolean;
    hoverable?: boolean;
    glass?: boolean;
}

export const Card = styled.div.withConfig(
    ignorePropsForDOMElement<CardProps>(["noPadding", "hoverable", "glass"]),
)<CardProps>`
    background: ${({ theme, glass }) =>
        glass
            ? theme.mode === "dark"
                ? "rgba(27, 31, 33, 0.72)"
                : "rgba(255, 255, 255, 0.82)"
            : theme.card};
    border-radius: ${({ theme }) => theme.radii.md};
    padding: ${({ noPadding, theme }) =>
        noPadding ? "0" : theme.spacing["3xl"]};
    box-shadow: ${({ theme }) => theme.shadow};
    border: 1px solid
        ${({ theme, glass }) => (glass ? theme.borderLight : theme.border)};
    transition:
        transform ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing},
        box-shadow ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing};
    position: relative;
    overflow: hidden;

    ${({ glass }) =>
        glass &&
        css`
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
        `}

    ${({ hoverable }) =>
        hoverable &&
        css`
            cursor: pointer;

            &:hover {
                transform: translateY(-2px);
                box-shadow: ${({ theme }) => theme.shadowLarge};
            }

            &:active {
                transform: translateY(0);
                box-shadow: ${({ theme }) => theme.shadow};
            }
        `}
`;

export const CardHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 36px;
    padding-bottom: ${({ theme }) => theme.spacing.xl};
    border-bottom: 1px solid ${({ theme }) => theme.border};

    @media (max-width: 1023px) {
        padding-bottom: 12px;
        margin-bottom: 16px;
    }
`;

export const CardTitle = styled.h1`
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.size.display};
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
    line-height: ${({ theme }) => theme.typography.lineHeight.display};
    color: ${({ theme }) => theme.text.primary};
    margin: 0;
    letter-spacing: 0;
`;

export const CardContent = styled.div`
    font-size: 1rem;
    font-weight: 400;

    p {
        margin-bottom: 16px;

        &:last-child {
            margin-bottom: 0;
        }
    }

    /* For numerical/hash values */
    code,
    .mono {
        font-weight: 500;
        font-size: 13px;
        line-height: 20px;
    }
`;
