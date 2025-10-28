import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { RootState } from "store";
import { toggleTheme } from "store/themeSlice";
import { selectNetwork } from "store/walletSlice";
import { logout } from "store/authSlice";
import { AccountSwitcher } from "components/AccountSwitcher";
import { SunIcon, MoonIcon, MenuIcon, CloseIcon, LogoutIcon } from "components/Icons";
import Logo from 'components/Logo';

const Container = styled.div`
    min-height: 100vh;
    display: flex;
    flex-direction: column;
`;

const Header = styled.header`
  background: ${({ theme }) => theme.card};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: 12px 16px;
  position: sticky;
  top: 0;
  z-index: 100;
  
  @media (max-width: 480px) {
    padding: 10px 12px;
  }
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  
  @media (max-width: 480px) {
    gap: 8px;
  }
`;

const HeaderBottom = styled.div`
    margin-top: 12px;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  
  @media (max-width: 480px) {
    gap: 8px;
  }
`;

const LogoContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
`;

const LogoText = styled.h1`
    font-family: 'Roboto Mono', monospace;
    font-size: 18px;
    font-weight: 700;
    color: ${({ theme }) => theme.text.primary};
    margin: 0;
    display: none;

    @media (min-width: 480px) {
        display: block;
    }

`;

const HeaderActions = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;

    @media (min-width: 769px) {
        gap: 16px;
    }
`;

const NetworkSelector = styled.select`
    padding: 6px 8px;
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 6px;
    background: ${({ theme }) => theme.surface};
    color: ${({ theme }) => theme.text.primary};
    font-size: 12px;
    max-width: 100px;

    @media (min-width: 480px) {
        max-width: none;
        padding: 8px 12px;
        font-size: 14px;
    }
`;

const IconButton = styled.button`
    padding: 8px;
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 6px;
    background: ${({ theme }) => theme.surface};
    color: ${({ theme }) => theme.text.primary};
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    min-height: 40px;

    &:hover {
        background: ${({ theme }) => theme.primary};
        color: white;
    }
`;

const MenuButton = styled(IconButton)`
    @media (min-width: 1024px) {
        display: none;
    }
`;

// Desktop Nav
const DesktopNav = styled.nav`
    background: ${({ theme }) => theme.surface};
    border-bottom: 1px solid ${({ theme }) => theme.border};
    padding: 0 24px;
    display: none;
    gap: 24px;
    overflow-x: auto;

    &::-webkit-scrollbar {
        height: 3px;
    }

    &::-webkit-scrollbar-track {
        background: ${({ theme }) => theme.surface};
    }

    &::-webkit-scrollbar-thumb {
        background: ${({ theme }) => theme.border};
        border-radius: 3px;
    }

    @media (min-width: 1024px) {
        display: flex;
    }
`;

// Mobile Nav Drawer
const MobileNavDrawer = styled.div<{ $isOpen: boolean }>`
    position: fixed;
    top: 0;
    right: ${({ $isOpen }) => ($isOpen ? "0" : "-100%")};
    width: 80%;
    max-width: 320px;
    height: 100vh;
    background: ${({ theme }) => theme.card};
    border-left: 1px solid ${({ theme }) => theme.border};
    transition: right 0.3s ease;
    z-index: 1000;
    overflow-y: auto;

    @media (min-width: 1024px) {
        display: none;
    }
`;

const MobileNavOverlay = styled.div<{ $isOpen: boolean }>`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: ${({ $isOpen }) => ($isOpen ? "block" : "none")};
    z-index: 999;

    @media (min-width: 1024px) {
        display: none;
    }
`;

const MobileNavHeader = styled.div`
    padding: 16px;
    border-bottom: 1px solid ${({ theme }) => theme.border};
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const MobileNavContent = styled.div`
    padding: 16px;
`;

const MobileNavSection = styled.div`
    margin-bottom: 24px;
`;

const MobileNavSectionTitle = styled.h3`
    font-size: 12px;
    text-transform: uppercase;
    color: ${({ theme }) => theme.text.tertiary};
    margin-bottom: 12px;
    font-weight: 600;
`;

const MobileNavLink = styled.button<{ $active: boolean }>`
    width: 100%;
    padding: 12px 16px;
    background: ${({ $active, theme }) =>
        $active ? theme.primary + "20" : "transparent"};
    border: none;
    border-left: 3px solid
        ${({ $active, theme }) => ($active ? theme.primary : "transparent")};
    color: ${({ $active, theme }) =>
        $active ? theme.primary : theme.text.secondary};
    font-weight: ${({ $active }) => ($active ? "600" : "400")};
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    font-size: 14px;
    margin-bottom: 4px;
    border-radius: 4px;

    &:hover {
        background: ${({ theme }) => theme.surface};
        color: ${({ theme }) => theme.primary};
    }
`;

const NavLink = styled.button<{ $active: boolean }>`
    padding: 16px 0;
    background: none;
    border: none;
    border-bottom: 3px solid
        ${({ $active, theme }) => ($active ? theme.primary : "transparent")};
    color: ${({ $active, theme }) =>
        $active ? theme.primary : theme.text.secondary};
    font-weight: ${({ $active }) => ($active ? "600" : "400")};
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    font-size: 14px;

    &:hover {
        color: ${({ theme }) => theme.primary};
    }
`;

const LogoutButton = styled(MobileNavLink)`
    background: ${({ theme }) => theme.danger};
    color: white;
    border-left-color: ${({ theme }) => theme.danger};

    &:hover {
        background: ${({ theme }) => theme.danger};
        opacity: 0.8;
    }
`;

const Main = styled.main<{ $fullWidth?: boolean }>`
    flex: 1;
    padding: ${({ $fullWidth }) => ($fullWidth ? "0" : "16px")};
    max-width: ${({ $fullWidth }) => ($fullWidth ? "none" : "1200px")};
    margin: 0 auto;
    width: 100%;

    @media (min-width: 769px) {
        padding: ${({ $fullWidth }) => ($fullWidth ? "0" : "24px")};
    }
`;

interface LogoImageProps {
  isDarkMode: boolean;
}

const LogoImage = ({isDarkMode}: LogoImageProps) => {
  const fillColor = isDarkMode ? "#FFFFFF" : "#000000";

  return (
    <svg width="34" height="23" viewBox="0 0 186 126" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0.473633 63.0687C0.473633 51.6685 9.70995 42.4211 21.1101 42.4211C32.5103 42.4211 41.7596 33.1829 41.7596 21.7827C41.7596 10.3844 51.0071 1.13504 62.4073 1.13504C73.8075 1.13504 83.0438 10.3844 83.0438 21.7827C83.0438 33.1829 73.8075 42.4211 62.4073 42.4211C51.0071 42.4211 41.7596 51.6685 41.7596 63.0687C41.7596 74.4689 51.0071 83.7052 62.4073 83.7052C73.8075 83.7052 83.0438 92.9545 83.0438 104.355C83.0438 115.753 73.8075 124.991 62.4073 124.991C51.0071 124.991 41.7596 115.753 41.7596 104.355C41.7596 92.9545 32.5103 83.7052 21.1101 83.7052C9.70995 83.7052 0.473633 74.4689 0.473633 63.0687Z" fill={fillColor} fill-opacity="0.87"/>
      <path d="M185.525 63.0576C185.525 74.4577 176.289 83.7052 164.889 83.7052C153.489 83.7052 144.241 92.9434 144.241 104.344C144.241 115.742 134.992 124.991 123.592 124.991C112.191 124.991 102.955 115.742 102.955 104.344C102.955 92.9434 112.191 83.7052 123.592 83.7052C134.992 83.7052 144.241 74.4577 144.241 63.0576C144.241 51.6574 134.992 42.4211 123.592 42.4211C112.191 42.4211 102.955 33.1717 102.955 21.7716C102.955 10.3732 112.191 1.13504 123.592 1.13504C134.992 1.13504 144.241 10.3732 144.241 21.7716C144.241 33.1717 153.489 42.4211 164.889 42.4211C176.289 42.4211 185.525 51.6574 185.525 63.0576Z" fill={fillColor} fill-opacity="0.87"/>
      <path d="M93.1989 82.8094C104.278 82.8094 113.26 73.8274 113.26 62.7482C113.26 51.6672 104.278 42.6852 93.1989 42.6852C82.1179 42.6852 73.1377 51.6672 73.1377 62.7482C73.1377 73.8274 82.1179 82.8094 93.1989 82.8094Z" fill={fillColor} fill-opacity="0.87"/>
    </svg>
  )
}

interface LayoutProps {
    children: React.ReactNode;
}

export const MobileLayout: React.FC<LayoutProps> = ({ children }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { darkMode } = useSelector((state: RootState) => state.theme);
    const { networks, selectedNetwork, accounts, selectedAccount } =
        useSelector((state: RootState) => state.wallet);
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const setCachedNetwork = () => {
            if (!isAuthenticated || !selectedAccount?.address) {
                return;
            }

            const networkByAddressMapRaw = localStorage.getItem(
                "NETWORKS_BY_ADDRESS"
            );

            if (!networkByAddressMapRaw) {
                return;
            }

            const networkByAddressMap = JSON.parse(networkByAddressMapRaw);
            const lastSelectedNetworkId =
                networkByAddressMap[selectedAccount.address];

            if (!lastSelectedNetworkId) {
                return;
            }

            const networkToSet = networks.find(
                (network) => network.id === lastSelectedNetworkId
            );

            if (!networkToSet) {
                return;
            }

            dispatch(selectNetwork(networkToSet.id));
        };

        setCachedNetwork();
    }, [isAuthenticated, selectedAccount, networks, dispatch]);

    const cacheNetworkByAddress = (networkId: string) => {
        if (!isAuthenticated || !selectedAccount?.address) {
            return;
        }

        const networkByAddressMapRaw = localStorage.getItem(
            "NETWORKS_BY_ADDRESS"
        );

        const networkByAddressMap = !!networkByAddressMapRaw
            ? JSON.parse(networkByAddressMapRaw)
            : {};

        networkByAddressMap[selectedAccount?.address] = networkId;

        localStorage.setItem(
            "NETWORKS_BY_ADDRESS",
            JSON.stringify(networkByAddressMap)
        );
    };

    const handleNetworkChange = (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {
        dispatch(selectNetwork(event.target.value));
        cacheNetworkByAddress(event.target.value);
    };

    const handleThemeToggle = () => {
        dispatch(toggleTheme());
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
        setMobileMenuOpen(false);
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        setMobileMenuOpen(false);
    };

    const navItems = useMemo(() => {
      if (!accounts?.length) {
        return [{ path: "/accounts", label: "Accounts" }]
      }

      return [
        { path: "/", label: "Dashboard" },
        { path: "/accounts", label: "Accounts" },
        { path: "/send", label: "Send" },
        { path: "/receive", label: "Receive" },
        { path: "/history", label: "History" },
        { path: "/deploy", label: "Deploy" },
        { path: "/ide", label: "IDE" },
        { path: "/keys", label: "Generate Keys" },
        { path: "/settings", label: "Settings" },
    ];

    }, [accounts])

    return (
    <Container>
      <Header>
        <HeaderTop>
          <LeftSection>
            <LogoContainer onClick={() => navigate('/')}>
              <LogoImage isDarkMode={darkMode} />
              <LogoText>ASI:Chain Wallet</LogoText>
            </LogoContainer>
          </LeftSection>
          
          <HeaderActions>
            <NetworkSelector 
              id="mobile-header-network-selector"
              value={selectedNetwork.id} 
              onChange={handleNetworkChange}
            >
              {networks.map((network) => (
                <option 
                  key={network.id} 
                  value={network.id}
                  disabled={!network.url || network.url.trim() === ''}
                >
                  {network.name}
                </option>
              ))}
            </NetworkSelector>
            
            <IconButton onClick={handleThemeToggle} title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {darkMode ? <SunIcon size={20} /> : <MoonIcon size={20} />}
            </IconButton>

            {isAuthenticated && (
              <IconButton onClick={handleLogout} title={'Logout'}>
                <LogoutIcon size={20} />
              </IconButton>
            )}
            
            <MenuButton id="sidebar-menu-button" onClick={() => setMobileMenuOpen(true)}>
              <MenuIcon size={20} />
            </MenuButton>
          </HeaderActions>
        </HeaderTop>
        
        {isAuthenticated && accounts.length > 0 && (
          <HeaderBottom>
            <AccountSwitcher />
          </HeaderBottom>
        )}
      </Header>

      <DesktopNav>
        {navItems.map(item => (
          <NavLink 
            key={item.path}
            $active={location.pathname === item.path} 
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </NavLink>
        ))}
      </DesktopNav>

      <MobileNavOverlay $isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(false)} />
      <MobileNavDrawer $isOpen={mobileMenuOpen}>
        <MobileNavHeader>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Menu</h2>
          <IconButton onClick={() => setMobileMenuOpen(false)}>
            <CloseIcon size={20} />
          </IconButton>
        </MobileNavHeader>
        
        <MobileNavContent>
          <MobileNavSection>
            <MobileNavSectionTitle>Navigation</MobileNavSectionTitle>
            {navItems.map(item => (
              <MobileNavLink
                key={item.path}
                $active={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
              >
                {item.label}
              </MobileNavLink>
            ))}
          </MobileNavSection>
          
          {isAuthenticated && (
            <MobileNavSection>
              <MobileNavSectionTitle>Account</MobileNavSectionTitle>
              <LogoutButton $active={false} onClick={handleLogout}>
                Logout
              </LogoutButton>
            </MobileNavSection>
          )}
        </MobileNavContent>
      </MobileNavDrawer>

      <Main $fullWidth={location.pathname === '/ide'}>{children}</Main>
    </Container>
  );
};
