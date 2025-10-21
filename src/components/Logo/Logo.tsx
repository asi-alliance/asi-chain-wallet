import React from 'react';
import styled from 'styled-components';
import { Theme } from '../../styles/theme';

interface LogoProps {
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const LogoContainer = styled.div<{ size: 'small' | 'medium' | 'large'; theme: Theme }>`
  display: flex;
  align-items: center;
  gap: 8px;
  
  ${({ size, theme }) => {
    switch (size) {
      case 'small':
        return `
          svg {
            width: 24px;
            height: 16px;
          }
          .logo-text {
            font-size: 14px;
          }
        `;
      case 'large':
        return `
          svg {
            width: 45px;
            height: 30px;
          }
          .logo-text {
            font-size: 20px;
          }
        `;
      default: // medium
        return `
          svg {
            width: 34px;
            height: 23px;
          }
          .logo-text {
            font-size: ${theme.fontSize.logo};
          }
        `;
    }
  }}
`;

const LogoText = styled.span`
  color: var(--Primary-Black, #000);
  font-family: "Roboto Mono", monospace;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  user-select: none;
`;

const LogoIcon = styled.svg`
  flex-shrink: 0;
`;

const Logo: React.FC<LogoProps> = ({ 
  showText = true, 
  size = 'medium', 
  className 
}) => {
  return (
    <LogoContainer size={size} className={className}>
      <LogoIcon 
        width="34" 
        height="23" 
        viewBox="0 0 34 23" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M0 11.3792C0 9.28467 1.697 7.58562 3.79157 7.58562C5.88615 7.58562 7.58554 5.88827 7.58554 3.7937C7.58554 1.69947 9.28458 7.82013e-05 11.3792 7.82013e-05C13.4737 7.82013e-05 15.1707 1.69947 15.1707 3.7937C15.1707 5.88827 13.4737 7.58562 11.3792 7.58562C9.28458 7.58562 7.58554 9.28467 7.58554 11.3792C7.58554 13.4738 9.28458 15.1708 11.3792 15.1708C13.4737 15.1708 15.1707 16.8702 15.1707 18.9648C15.1707 21.059 13.4737 22.7563 11.3792 22.7563C9.28458 22.7563 7.58554 21.059 7.58554 18.9648C7.58554 16.8702 5.88615 15.1708 3.79157 15.1708C1.697 15.1708 0 13.4738 0 11.3792Z" 
          fill="currentColor" 
        />
        <path 
          d="M34.0001 11.3772C34.0001 13.4718 32.3031 15.1708 30.2085 15.1708C28.1139 15.1708 26.4149 16.8682 26.4149 18.9627C26.4149 21.057 24.7155 22.7563 22.6209 22.7563C20.5263 22.7563 18.8293 21.057 18.8293 18.9627C18.8293 16.8682 20.5263 15.1708 22.6209 15.1708C24.7155 15.1708 26.4149 13.4718 26.4149 11.3772C26.4149 9.28262 24.7155 7.58562 22.6209 7.58562C20.5263 7.58562 18.8293 5.88623 18.8293 3.79165C18.8293 1.69742 20.5263 7.82013e-05 22.6209 7.82013e-05C24.7155 7.82013e-05 26.4149 1.69742 26.4149 3.79165C26.4149 5.88623 28.1139 7.58562 30.2085 7.58562C32.3031 7.58562 34.0001 9.28262 34.0001 11.3772Z" 
          fill="currentColor" 
        />
        <path 
          d="M17.036 15.0063C19.0716 15.0063 20.7218 13.3561 20.7218 11.3205C20.7218 9.28455 19.0716 7.63426 17.036 7.63426C15 7.63426 13.3501 9.28455 13.3501 11.3205C13.3501 13.3561 15 15.0063 17.036 15.0063Z" 
          fill="currentColor" 
        />
      </LogoIcon>
      {showText && (
        <LogoText className="logo-text">
          ASI
        </LogoText>
      )}
    </LogoContainer>
  );
};

export default Logo;
