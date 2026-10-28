import React from "react";
import styled from "styled-components";

const LoaderContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
`;

const Spinner = styled.div`
    width: 40px;
    height: 40px;
    border: 3px solid transparent;
    border-top-color: ${({ theme }) => theme.primary};
    border-right-color: ${({ theme }) => theme.primary};
    border-radius: 50%;
    animation: spin 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
`;

export const Loader: React.FC = () => (
    <LoaderContainer>
        <Spinner />
    </LoaderContainer>
);