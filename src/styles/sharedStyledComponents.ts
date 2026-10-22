import styled from "styled-components";

export const TextSecondaryBlock = styled.div`
    color: ${({ theme }) => theme.text.secondary};
`;

export const TextTertiaryBlock = styled.div`
    color: ${({ theme }) => theme.text.tertiary};
`;

export const FilterLabel = styled.span`
    font-size: ${({ theme }) => theme.typography.size.md};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
    font-weight: 500;
    color: ${({ theme }) => theme.text.secondary};
`;
