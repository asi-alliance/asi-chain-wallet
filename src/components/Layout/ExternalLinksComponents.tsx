import React, { Fragment } from "react";
import styled from "styled-components";
import { ExternalIcon } from "components/Icons";

const ExternalNavLink = styled.button`
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 8px 0;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: ${({ theme }) => theme.text.primary};
    font-weight: 400;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    font-size: 14px;

    &:hover {
        color: ${({ theme }) => theme.primary};
    }
`;

interface ExternalLink {
    path: string;
    label: string;
}

const externalLinksSet: ExternalLink[] = [
    { path: `${process.env.REACT_APP_EXPLORER_URL}`, label: "Explorer" },
    { path: `${process.env.REACT_APP_FAUCET_URL}`, label: "Faucet" },
];

export const ExternalLinks: React.FC = () => {
    return (
        <Fragment>
            {externalLinksSet.map((item) => (
                <ExternalNavLink
                    key={item.path}
                    className="text-1"
                    onClick={() => window.open(item.path, "_blank")}
                >
                    {item.label}
                    <ExternalIcon />
                </ExternalNavLink>
            ))}
        </Fragment>
    );
};

const ExternalNavLinkMobile = styled.button`
    width: 100%;
    padding: 12px 16px;
    background: transparent;
    border: none;
    border-left: 3px solid transparent;
    color: ${({ theme }) => theme.text.primary};
    font-weight: 400;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    font-size: 14px;
    margin-bottom: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 5px;

    &:hover {
        background: ${({ theme }) => theme.surface};
        color: ${({ theme }) => theme.primary};
    }
`;

export const ExternalLinksMobile: React.FC = () => {
    return (
        <Fragment>
            {externalLinksSet.map((item) => (
                <ExternalNavLinkMobile
                    key={item.path}
                    className="text-1"
                    onClick={() => window.open(item.path, "_blank")}
                >
                    {item.label}
                    <ExternalIcon />
                </ExternalNavLinkMobile>
            ))}
        </Fragment>
    );
};
