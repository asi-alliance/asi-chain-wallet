import React from "react";
import styled from "styled-components";

const Delimiter = styled.div`
    display: flex;
    align-items: center;
`;

const DelimiterLine = styled.div`
    width: 100%;
    height: 1px;
    background: ${({ theme }) => theme.border};
    margin: 16px auto;
`;

export const DelimiterBlock: React.FC = () => (
    <Delimiter>
        <svg
            width="1"
            height="24"
            viewBox="0 0 1 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <line
                x1="0.5"
                y1="24"
                x2="0.500001"
                y2="-2.18557e-08"
                stroke="currentcolor"
            />
        </svg>
    </Delimiter>
);

export const DelimiterBlockMobile: React.FC = () => <DelimiterLine />;
