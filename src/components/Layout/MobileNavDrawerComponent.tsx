import React, { Fragment } from "react";
import styled from "styled-components";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store";
import { logout } from "store/authSlice";
import { CloseIcon } from "components/Icons";
import { Button } from "components/Button";
import { AccountSwitcher } from "components/AccountSwitcher";

const MobileNavDrawerStyled = styled.div<{ $isOpen: boolean }>`
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

    display: flex;
    flex-direction: column;

    @media (min-width: 1250px) {
        display: none;
    }
`;

const MobileNavOverlayStyled = styled.div<{ $isOpen: boolean }>`
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
    /* margin-bottom: 24px; */
`;

const MobileNavFooter = styled.div`
    padding: 25px;
    margin-top: auto;
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

const ExternalNavLinkMobile = styled(MobileNavLink)`
    color: ${({ theme }) => theme.text.primary};
    display: flex;
    align-items: center;
    gap: 5px;
`;

const DelimiterLine = styled.div`
    width: 100%;
    height: 1px;
    background: ${({ theme }) => theme.border};
    margin: 16px auto;
`;

const LogoutButton = styled(Button)`
    border-color: ${({ theme }) => theme.danger};
    color: ${({ theme }) => theme.danger};

    &:hover:not(:disabled) {
        background: ${({ theme }) => theme.danger}1F;
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
    width: 30px;
    height: 30px;

    &:hover {
        background: ${({ theme }) => theme.primary};
        color: white;
    }
`;

const ExternalIcon = () => (
    <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M10.6667 10.6667H1.33333V1.33333H6V0H1.33333C0.593333 0 0 0.6 0 1.33333V10.6667C0 11.4 0.593333 12 1.33333 12H10.6667C11.4 12 12 11.4 12 10.6667V6H10.6667V10.6667ZM7.33333 0V1.33333H9.72667L3.17333 7.88667L4.11333 8.82667L10.6667 2.27333V4.66667H12V0H7.33333Z"
            fill="currentcolor"
        />
    </svg>
);

const externalLinksSet = [
    { path: `${process.env.REACT_APP_EXPLORER_URL}`, label: "Explorer" },
    { path: `${process.env.REACT_APP_FAUCET_URL}`, label: "Faucet" },
];

interface NavItem {
    path: string;
    label: string;
}

interface MobileNavDrawerComponentProps {
    isOpen: boolean;
    navItems: NavItem[];
    onClose: () => void;
}

export const MobileNavDrawerComponent: React.FC<
    MobileNavDrawerComponentProps
> = ({ isOpen, navItems, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    const handleNavigation = (path: string) => {
        navigate(path);
        onClose();
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
        onClose();
    };

    return (
        <>
            <MobileNavOverlayStyled $isOpen={isOpen} onClick={onClose} />
            <MobileNavDrawerStyled
                className="mobile-nav-drawer-styled"
                $isOpen={isOpen}
            >
                <MobileNavHeader>
                    <h2 style={{ margin: 0, fontSize: "18px" }}>Menu</h2>
                    <IconButton onClick={onClose}>
                        <CloseIcon size={20} />
                    </IconButton>
                </MobileNavHeader>

                <MobileNavContent>
                    <MobileNavSection>
                        {navItems.map((item) => (
                            <MobileNavLink
                                key={item.path}
                                $active={location.pathname === item.path}
                                onClick={() => handleNavigation(item.path)}
                            >
                                {item.label}
                            </MobileNavLink>
                        ))}
                        <DelimiterLine />
                        {externalLinksSet.map((item) => (
                            <ExternalNavLinkMobile
                                $active={false}
                                key={item.path}
                                className="text-1"
                                onClick={() => window.open(item.path, "_blank")}
                            >
                                {item.label}
                                <ExternalIcon />
                            </ExternalNavLinkMobile>
                        ))}
                    </MobileNavSection>
                </MobileNavContent>
                <MobileNavFooter>
                    <AccountSwitcher
                        adaptive={false}
                        layout="vertical"
                        fullWidth
                        listDirection="top"
                        wrapperStyle={{ marginBottom: "36px" }}
                    />
                    {isAuthenticated && (
                        <LogoutButton
                            fullWidth
                            variant="secondary"
                            onClick={handleLogout}
                        >
                            Logout
                            <svg
                                width="20"
                                height="18"
                                viewBox="0 0 20 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M2 2L10 2L10 0L2 6.99382e-07C0.899998 7.95547e-07 -1.49493e-06 0.9 -1.39876e-06 2L-1.74846e-07 16C-7.86805e-08 17.1 0.9 18 2 18L10 18L10 16L2 16L2 2Z"
                                    fill="currentcolor"
                                />
                                <path
                                    d="M15 4L13.6 5.4L16.2 8H6V10H16.2L13.6 12.6L15 14L20 9L15 4Z"
                                    fill="currentcolor"
                                />
                            </svg>
                        </LogoutButton>
                    )}
                </MobileNavFooter>
            </MobileNavDrawerStyled>
        </>
    );
};
