import styled from "styled-components";
import { Button } from "components";

export const FilterPanelTitle = styled.span`
    display: block;
    margin-bottom: ${({ theme }) => theme.spacing.md};
    color: ${({ theme }) => theme.text.secondary};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.xs};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.xs};
`;

export const PresetGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${({ theme }) => theme.spacing.md};
    margin-bottom: ${({ theme }) => theme.spacing.xl};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
`;

export const PresetButton = styled(Button)`
    min-width: 0;
`;

export const OptionList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.md};
`;
