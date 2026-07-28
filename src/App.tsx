import React, { useEffect } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import { store, RootState, AppDispatch } from "store";
import { GlobalStyles } from "styles/GlobalStyles";
import { lightTheme, darkTheme } from "styles/theme";
import { Layout } from "components";
import { Dashboard } from "pages/Dashboard";
import { Send } from "pages/Send";
//TODO: Restore Bridge once the SDK exposes a signer-based deploy/lock flow
// import { Bridge } from "pages/Bridge";
import { Receive } from "pages/Receive";
import { Accounts } from "pages/Accounts";
//TODO: Restore Deploy/IDE once the SDK exposes a signer-based raw deploy/explore flow
// import { Deploy } from "pages/Deploy";
// import { IDE } from "pages/IDE";
import { Settings } from "pages/Settings";
import { KeyGenerator } from "pages/KeyGenerator";
import { Login } from "pages/Login";
import { History } from "pages/History";
import { useIdleTimer } from "hooks";
import { ExistingAccountGuard } from "components/ExistingAccountGuard";
//TODO: Restore transaction status polling once the SDK deploy-status poller is wired in
// import TransactionPollingService from "services/transactionPolling";
import FeedbackForm from "components/community/FeedbackForm";
import { QueryProvider } from "components/QueryProvider";
import { EvmProvider } from "components/EvmProvider";
import { loadWalletsFromStorage } from "store/WalletsStore/thunks";
import { selectHasWallets } from "store/WalletsStore";
import { SdkClientProvider } from "sdk";

import "@rainbow-me/rainbowkit/styles.css";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const isAuthenticated = useSelector(
        (state: RootState) => state.auth.isAuthenticated,
    );
    const hasWallets = useSelector(selectHasWallets);

    if (!hasWallets) {
        return <Navigate to="/accounts" replace />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

const AppContent: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { darkMode } = useSelector((state: RootState) => state.theme);
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const theme = darkMode ? darkTheme : lightTheme;

    useIdleTimer();

    const loadWallets = async (): Promise<void> => {
        try {
            await dispatch(loadWalletsFromStorage()).unwrap();
        } catch (error: unknown) {
            console.error(
                "LOAD WALLETS FROM STORAGE ERROR: ",
                (error as Error).message,
            );
        }
    };

    useEffect(() => {
        // dispatch(loadNetworksFromStorage());
        loadWallets();
    }, [dispatch]);

    //TODO: Removed legacy RChain polling. Deploy status is now tracked via the SDK DeployStatusPoller in the sendTransaction thunk.
    // useEffect(() => {
    //     if (isAuthenticated) {
    //         TransactionPollingService.start();
    //     } else {
    //         TransactionPollingService.stop();
    //     }
    //     return () => {
    //         TransactionPollingService.stop();
    //     };
    // }, [isAuthenticated]);

    return (
        <ThemeProvider theme={theme}>
            <GlobalStyles theme={theme} />
            <Routes>
                {/* Public route for login */}
                <Route path="/login" element={<Login />} />
                {/* Accounts page can be accessed without auth for initial setup */}
                <Route
                    path="/accounts"
                    element={
                        <ExistingAccountGuard>
                            <Layout>
                                <Accounts />
                            </Layout>
                        </ExistingAccountGuard>
                    }
                />
                {/* Protected routes */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Dashboard />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/send"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Send />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/* TODO: Restore Bridge once the SDK exposes a signer-based deploy/lock flow
                <Route
                    path="/bridge"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Bridge />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                */}
                <Route
                    path="/receive"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Receive />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/history"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <History />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/* TODO: Restore Deploy/IDE once the SDK exposes a signer-based raw deploy/explore flow
                <Route
                    path="/deploy"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Deploy />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/ide"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <IDE />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                */}
                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Settings />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/keys"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <KeyGenerator />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="*"
                    element={
                        <Navigate
                            to={isAuthenticated ? "/" : "/login"}
                            replace
                        />
                    }
                />
            </Routes>
            <FeedbackForm />
        </ThemeProvider>
    );
};

const App: React.FC = () => {
    return (
        <Provider store={store}>
            <Router
                future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                }}
            >
                <QueryProvider>
                    <EvmProvider>
                        <SdkClientProvider>
                            <AppContent />
                        </SdkClientProvider>
                    </EvmProvider>
                </QueryProvider>
            </Router>
        </Provider>
    );
};

export default App;
