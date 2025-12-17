import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { store, RootState } from 'store';
import { checkAuthentication } from 'store/authSlice';
import { loadNetworksFromStorage, loadAccountsFromStorage } from 'store/walletSlice';
import { GlobalStyles } from 'styles/GlobalStyles';
import { lightTheme, darkTheme } from 'styles/theme';
import { Layout } from 'components';
import { Dashboard } from 'pages/Dashboard';
import { Send } from 'pages/Send';
import { Receive } from 'pages/Receive';
import { Accounts } from 'pages/Accounts';
import { Deploy } from 'pages/Deploy';
import { IDE } from 'pages/IDE';
import { Settings } from 'pages/Settings';
import { KeyGenerator } from 'pages/KeyGenerator';
import { Login } from 'pages/Login';
import { History } from 'pages/History';
import { useIdleTimer, useDeepLink } from 'hooks';
import TransactionPollingService from 'services/transactionPolling';
import FeedbackForm from 'components/community/FeedbackForm';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, hasAccounts } = useSelector((state: RootState) => state.auth);
  
  if (!hasAccounts) {
    return <Navigate to="/accounts" replace />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const dispatch = useDispatch();
  const { darkMode } = useSelector((state: RootState) => state.theme);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const theme = darkMode ? darkTheme : lightTheme;

  useIdleTimer();
  
  useDeepLink();

  useEffect(() => {
    console.log('[App] Initializing app, checking auth...');
    dispatch(checkAuthentication());
    dispatch(loadNetworksFromStorage());
    dispatch(loadAccountsFromStorage());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      TransactionPollingService.start();
    } else {
      TransactionPollingService.stop();
    }
    return () => {
      TransactionPollingService.stop();
    };
  }, [isAuthenticated]);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles theme={theme} />
      <Routes>
        {/* Public route for login */}
        <Route path="/login" element={<Login />} />
        
        {/* Accounts page can be accessed without auth for initial setup */}
        <Route path="/accounts" element={
          <Layout>
            <Accounts />
          </Layout>
        } />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/send" element={
          <ProtectedRoute>
            <Layout>
              <Send />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/receive" element={
          <ProtectedRoute>
            <Layout>
              <Receive />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/history" element={
          <ProtectedRoute>
            <Layout>
              <History />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/deploy" element={
          <ProtectedRoute>
            <Layout>
              <Deploy />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/ide" element={
          <ProtectedRoute>
            <Layout>
              <IDE />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/keys" element={
          <ProtectedRoute>
            <Layout>
              <KeyGenerator />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="*" element={
          <Navigate to={isAuthenticated ? "/" : "/login"} replace />
        } />
      </Routes>
      <FeedbackForm />
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
};

export default App;