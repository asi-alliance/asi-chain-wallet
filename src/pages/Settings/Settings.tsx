import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { RootState } from 'store';
import { Card, CardHeader, CardTitle, CardContent, Button, PrivateKeyDisplay, PasswordModal } from 'components';
import { CustomNetworkConfig } from './CustomNetworkConfig';
import { SecureStorage } from 'services/secureStorage';

const SettingsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const NetworkCard = styled(Card)`
  margin-bottom: 24px;
`;

export const Settings: React.FC = () => {
  const { accounts } = useSelector((state: RootState) => state.wallet);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [selectedAccountForPrivateKey, setSelectedAccountForPrivateKey] = useState<string | null>(null);
  const [privateKeyPassword, setPrivateKeyPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleViewPrivateKey = (accountId: string) => {
    setSelectedAccountForPrivateKey(accountId);
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = (password: string) => {
    if (selectedAccountForPrivateKey) {
      const account = SecureStorage.unlockAccount(selectedAccountForPrivateKey, password);
      if (account?.privateKey) {
        setPrivateKeyPassword(password);
        setShowPasswordModal(false);
        setShowPrivateKey(true);
      } else {
        alert('Invalid password');
      }
    }
  };

  const handlePrivateKeyClose = () => {
    setShowPrivateKey(false);
    setSelectedAccountForPrivateKey(null);
    setPrivateKeyPassword('');
  };

  return (
    <SettingsContainer>
      <h2>Network Settings</h2>
      
      <CustomNetworkConfig />

      {/* Private Keys Section */}
      <NetworkCard>
        <CardHeader>
          <CardTitle>Private Keys Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            View and export your private keys. Keep them safe and never share them with anyone.
          </p>
          
          {accounts.length === 0 ? (
            <p>No accounts found. Create an account first.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {accounts.map((account) => (
                <div
                  key={account.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: '#f9f9f9'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {account.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', fontFamily: 'monospace' }}>
                      {account.revAddress.slice(0, 10)}...{account.revAddress.slice(-8)}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleViewPrivateKey(account.id)}
                  >
                    View Private Key
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </NetworkCard>

      {/* Password Modal for Private Key */}
      {showPasswordModal && selectedAccountForPrivateKey && (
        <PasswordModal
          isOpen={showPasswordModal}
          title="Enter Password to View Private Key"
          onConfirm={handlePasswordSubmit}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedAccountForPrivateKey(null);
          }}
        />
      )}

      {/* Private Key Display Modal */}
      {showPrivateKey && selectedAccountForPrivateKey && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{ maxWidth: '600px', width: '100%' }}>
            <PrivateKeyDisplay
              privateKey={SecureStorage.unlockAccount(selectedAccountForPrivateKey, privateKeyPassword)?.privateKey || ''}
              accountName={accounts.find(acc => acc.id === selectedAccountForPrivateKey)?.name || ''}
              onContinue={handlePrivateKeyClose}
              onBack={handlePrivateKeyClose}
              showBackButton={false}
            />
          </div>
        </div>
      )}
    </SettingsContainer>
  );
};