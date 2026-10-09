import { createGlobalStyle } from "styled-components";
import { Theme } from "./theme";

export const GlobalStyles = createGlobalStyle<{ theme: Theme }>`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
    min-width: 320px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  html, body, #root {
    min-height: 100%;
  }

  p {
    margin-bottom: 1rem;
    color: ${({ theme }) => theme.text.secondary};
  }

  code {
    font-family: ${({ theme }) => theme.typography.fontFamily};
    background: ${({ theme }) => theme.surface};
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
  }

  a {
    color: ${({ theme }) => theme.actionText};
    text-decoration: none;
    transition: all 0.2s ease;

    &:hover {
      opacity: 0.8;
    }
  }

  button {
    cursor: pointer;
    border: none;
    outline: none;
    font: inherit;
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    transition: all ${({ theme }) => theme.motion.normal} ${({ theme }) => theme.motion.easing};
    
    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

  }

  /* Native field fallback — shared chrome; typography split below. */
  input, textarea, select {
    font: inherit;
    background: ${({ theme }) => theme.control.fieldBackground};
    color: ${({ theme }) => theme.text.primary};
    border: ${({ theme }) => theme.control.borderWidth} solid ${({ theme }) => theme.control.fieldBorder};
    transition:
      border-color ${({ theme }) => theme.motion.normal} ${({ theme }) => theme.motion.easing},
      box-shadow ${({ theme }) => theme.motion.normal} ${({ theme }) => theme.motion.easing},
      background-color ${({ theme }) => theme.motion.normal} ${({ theme }) => theme.motion.easing};
    outline: none;

    &:hover:not(:disabled):not(:focus) {
      border-color: var(--control-field-hover-border, ${({ theme }) => theme.control.fieldHoverBorder});
    }

    &[aria-invalid="true"] {
      border-color: ${({ theme }) => theme.danger};
    }

    &[aria-invalid="true"]:hover:not(:disabled) {
      border-color: ${({ theme }) => theme.danger};
    }

    &:focus {
      border-color: ${({ theme }) => theme.primary};
    }

    &[aria-invalid="true"]:focus {
      border-color: ${({ theme }) => theme.danger};
    }

    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 4px ${({ theme }) => theme.focusRing};
    }

    &[aria-invalid="true"]:focus-visible {
      outline: none;
      box-shadow: 0 0 0 4px ${({ theme }) => theme.dangerFocusRing};
    }

    &:disabled {
      cursor: not-allowed;
      background: ${({ theme }) => theme.control.disabledBackground};
      border-color: ${({ theme }) => theme.control.disabledBorder};
    }

    &::placeholder {
      color: ${({ theme }) => theme.text.tertiary};
    }
  }

  input, textarea {
    font-family: ${({ theme }) => theme.typography.fontFamily};
  }

  select {
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
  }

  /* Modern scrollbar styling */
  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.surface};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.border};
    border-radius: 5px;
    
    &:hover {
      background: ${({ theme }) => theme.text.tertiary};
    }
  }

  /* Selection styling */
  ::selection {
    background: ${({ theme }) => theme.primary};
    color: ${({ theme }) => theme.background};
  }

  /* Focus styles — semantic focusRing; fields override with box-shadow above */
  *:focus-visible {
    outline: 2px solid ${({ theme }) => theme.focusRing};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.radii.xs};
  }

  /* Animations */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  /* Utility classes */
  .fade-in {
    animation: fadeIn 0.3s ease-out;
  }

  .slide-in {
    animation: slideIn 0.3s ease-out;
  }

  /* Glass morphism effect */
  .glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Disable user select on UI elements */
  button, label {
    user-select: none;
  }

  /* Loading skeleton */
  .skeleton {
    background: linear-gradient(
      90deg,
      ${({ theme }) => theme.surface} 0px,
      ${({ theme }) => theme.card} 40px,
      ${({ theme }) => theme.surface} 80px
    );
    background-size: 1000px 100%;
    animation: shimmer 1.5s infinite linear;
  }

  body {
    background: ${({ theme }) => theme.background};
    color: ${({ theme }) => theme.text.primary};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.size.md};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
    font-weight: ${({ theme }) => theme.typography.weight.regular};
    transition: background-color ${({ theme }) => theme.motion.slow} ${({ theme }) => theme.motion.easing}, color ${({ theme }) => theme.motion.slow} ${({ theme }) => theme.motion.easing};
    overflow-x: hidden;
  }
  
  h1, h2, h3, h4, h5 {
    letter-spacing: 0;
    margin: 0;
    padding: 0;
  }

  h1 {
    font-size: ${({ theme }) => theme.typography.size.display};
    line-height: ${({ theme }) => theme.typography.lineHeight.display};
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
    }
    
  h2 {
    font-size: ${({ theme }) => theme.typography.size.xl};
    line-height: ${({ theme }) => theme.typography.lineHeight.xl};
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
  }

  h3 {
      font-size: ${({ theme }) => theme.typography.size.lg};
      line-height: ${({ theme }) => theme.typography.lineHeight.lg};
      font-weight: 700;
  }

  h4 {
    font-size: ${({ theme }) => theme.typography.size.md};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
  }

  h4.light {
    font-weight: 500;
  }
  
  h5 {
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
  }

  .text-1 {
    font-size: 1.125rem;
  }

  .text-2 {
    font-size: 1rem;
  }
      
  .text-3 {
    font-size: 0.875rem;
  }
        
  .text-4 {
    font-size: 0.75rem;
  }

  .text-5 {
    font-size: 0.5rem;
  }

  .text-light {
  font-weight: 400;
  }

  .text-ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

  
  @media (max-width: 768px) {
       h1 {
        font-size: ${({ theme }) => theme.fontSize.xl};
        line-height: 1.3;
       }

       .text-2 {
       font-size: 0.875rem;
       }
   }

  .text-danger {
    color: ${({ theme }) => theme.dangerText};
   }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      scroll-behavior: auto !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }

    button:active {
      transform: none;
    }
  }
`;
