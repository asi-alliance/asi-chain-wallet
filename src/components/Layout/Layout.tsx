import React from 'react';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { RootState } from 'store';
import { toggleTheme } from 'store/themeSlice';
import { selectNetwork } from 'store/walletSlice';
import { SunIcon, MoonIcon } from 'components/Icons';
import { logout } from 'store/authSlice';
import { AccountSwitcher } from 'components/AccountSwitcher';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  background: ${({ theme }) => theme.card};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  
  @media (max-width: 768px) {
    padding: 12px 16px;
    gap: 12px;
    flex-wrap: wrap;
    min-height: auto;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
  min-width: 0;
  
  @media (max-width: 768px) {
    gap: 12px;
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
`;

const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const LogoText = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
  
  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  
  @media (max-width: 768px) {
    gap: 8px;
    flex-shrink: 0;
  }
`;

const NetworkSelector = styled.select`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.text.primary};
  font-size: 14px;
  
  @media (max-width: 768px) {
    padding: 6px 8px;
    font-size: 12px;
    min-width: 80px;
  }
`;

const ThemeToggle = styled.button`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.text.primary};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (max-width: 768px) {
    padding: 6px 8px;
    font-size: 12px;
  }

  &:hover {
    background: ${({ theme }) => theme.primary};
    color: white;
  }
`;

const Main = styled.main<{ fullWidth?: boolean }>`
  flex: 1;
  padding: ${({ fullWidth }) => fullWidth ? '0' : '24px'};
  max-width: ${({ fullWidth }) => fullWidth ? 'none' : '1200px'};
  margin: 0 auto;
  width: 100%;
`;

const Nav = styled.nav`
  background: ${({ theme }) => theme.surface};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: 0 24px;
  display: flex;
  gap: 24px;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: 768px) {
    padding: 0 16px;
    gap: 16px;
  }
  
  @media (max-width: 480px) {
    padding: 0 12px;
    gap: 12px;
  }
`;

const NavLink = styled.button<{ active: boolean }>`
  padding: 16px 0;
  background: none;
  border: none;
  border-bottom: 3px solid ${({ active, theme }) => (active ? theme.primary : 'transparent')};
  color: ${({ active, theme }) => (active ? theme.primary : theme.text.secondary)};
  font-weight: ${({ active }) => (active ? '600' : '400')};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    padding: 12px 0;
    font-size: 14px;
  }
  
  @media (max-width: 480px) {
    padding: 10px 0;
    font-size: 13px;
  }

  &:hover {
    color: ${({ theme }) => theme.primary};
  }
`;

const LogoutButton = styled(ThemeToggle)`
  background: ${({ theme }) => theme.danger};
  color: white;
  
  &:hover {
    background: ${({ theme }) => theme.danger};
    opacity: 0.8;
  }
`;

interface LogoImageProps {
  isDarkMode: boolean;
}

const LogoImage = ({isDarkMode}: LogoImageProps) => {
  const fillColor = isDarkMode ? "#FFFFFF" : "#000000";

  return (
    <svg width="28" height="126" viewBox="0 0 186 126" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0.473633 63.0687C0.473633 51.6685 9.70995 42.4211 21.1101 42.4211C32.5103 42.4211 41.7596 33.1829 41.7596 21.7827C41.7596 10.3844 51.0071 1.13504 62.4073 1.13504C73.8075 1.13504 83.0438 10.3844 83.0438 21.7827C83.0438 33.1829 73.8075 42.4211 62.4073 42.4211C51.0071 42.4211 41.7596 51.6685 41.7596 63.0687C41.7596 74.4689 51.0071 83.7052 62.4073 83.7052C73.8075 83.7052 83.0438 92.9545 83.0438 104.355C83.0438 115.753 73.8075 124.991 62.4073 124.991C51.0071 124.991 41.7596 115.753 41.7596 104.355C41.7596 92.9545 32.5103 83.7052 21.1101 83.7052C9.70995 83.7052 0.473633 74.4689 0.473633 63.0687Z" fill={fillColor} fill-opacity="0.87"/>
      <path d="M185.525 63.0576C185.525 74.4577 176.289 83.7052 164.889 83.7052C153.489 83.7052 144.241 92.9434 144.241 104.344C144.241 115.742 134.992 124.991 123.592 124.991C112.191 124.991 102.955 115.742 102.955 104.344C102.955 92.9434 112.191 83.7052 123.592 83.7052C134.992 83.7052 144.241 74.4577 144.241 63.0576C144.241 51.6574 134.992 42.4211 123.592 42.4211C112.191 42.4211 102.955 33.1717 102.955 21.7716C102.955 10.3732 112.191 1.13504 123.592 1.13504C134.992 1.13504 144.241 10.3732 144.241 21.7716C144.241 33.1717 153.489 42.4211 164.889 42.4211C176.289 42.4211 185.525 51.6574 185.525 63.0576Z" fill={fillColor} fill-opacity="0.87"/>
      <path d="M93.1989 82.8094C104.278 82.8094 113.26 73.8274 113.26 62.7482C113.26 51.6672 104.278 42.6852 93.1989 42.6852C82.1179 42.6852 73.1377 51.6672 73.1377 62.7482C73.1377 73.8274 82.1179 82.8094 93.1989 82.8094Z" fill={fillColor} fill-opacity="0.87"/>
    </svg>
  )
}

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useSelector((state: RootState) => state.theme);
  const { networks, selectedNetwork, accounts } = useSelector((state: RootState) => state.wallet);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  

  const handleNetworkChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(selectNetwork(event.target.value));
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <Container>
      <Header>
        <LeftSection>
          <LogoContainer onClick={() => navigate('/')}>
            <LogoWrapper>
              <LogoImage isDarkMode={darkMode} />
            </LogoWrapper>
            <LogoText>ASI Wallet v2</LogoText>
          </LogoContainer>
          {isAuthenticated && accounts.length > 0 && (
            <AccountSwitcher />
          )}
          {isAuthenticated && accounts.length === 0 && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              No accounts yet
            </div>
          )}
        </LeftSection>
        <HeaderActions>
          <NetworkSelector 
            id="header-network-selector"
            value={selectedNetwork.id} 
            onChange={handleNetworkChange}
          >
            {networks.map((network) => (
              <option key={network.id} value={network.id}>
                {network.name}
              </option>
            ))}
          </NetworkSelector>
          <ThemeToggle onClick={handleThemeToggle} title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            {darkMode ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </ThemeToggle>
          {isAuthenticated && (
            <LogoutButton onClick={handleLogout}>
              Logout
            </LogoutButton>
          )}
        </HeaderActions>
      </Header>
      <Nav>
        <NavLink 
          active={location.pathname === '/'} 
          onClick={() => navigate('/')}
        >
          Dashboard
        </NavLink>
        <NavLink 
          active={location.pathname === '/accounts'} 
          onClick={() => navigate('/accounts')}
        >
          Accounts
        </NavLink>
        <NavLink 
          active={location.pathname === '/send'} 
          onClick={() => navigate('/send')}
        >
          Send
        </NavLink>
        <NavLink 
          active={location.pathname === '/receive'} 
          onClick={() => navigate('/receive')}
        >
          Receive
        </NavLink>
        <NavLink 
          active={location.pathname === '/history'} 
          onClick={() => navigate('/history')}
        >
          History
        </NavLink>
        <NavLink 
          active={location.pathname === '/deploy'} 
          onClick={() => navigate('/deploy')}
        >
          Deploy
        </NavLink>
        <NavLink 
          active={location.pathname === '/ide'} 
          onClick={() => navigate('/ide')}
        >
          IDE
        </NavLink>
        <NavLink 
          active={location.pathname === '/keys'} 
          onClick={() => navigate('/keys')}
        >
          Generate Keys
        </NavLink>
        <NavLink 
          active={location.pathname === '/settings'} 
          onClick={() => navigate('/settings')}
        >
          Settings
        </NavLink>
      </Nav>
      <Main fullWidth={location.pathname === '/ide'}>{children}</Main>
    </Container>
  );
};