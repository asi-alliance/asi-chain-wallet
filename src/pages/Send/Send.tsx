import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import QrScanner from 'qr-scanner';
import { RootState } from 'store';
import { sendTransaction, fetchBalance, updateAccountBalance } from 'store/walletSlice';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, TransactionConfirmationModal } from 'components';
import { getTokenDisplayName } from '../../constants/token';
import addressValidation from 'utils/AddressValidation';

const SendContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const BalanceInfo = styled.div`
  background: ${({ theme }) => theme.surface};
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  text-align: center;
`;

const BalanceAmount = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.primary};
`;

const BalanceLabel = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.text.secondary};
  margin-top: 4px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
`;

const ErrorMessage = styled.div`
  background: ${({ theme }) => theme.danger};
  color: white;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const SuccessMessage = styled.div`
  background: ${({ theme }) => theme.success};
  color: ${({ theme }) => theme.text.inverse};
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  word-break: break-all;
  box-shadow: ${({ theme }) => theme.shadowLarge};
  
  /* Force inverse text for all content */
  * {
    color: ${({ theme }) => theme.text.inverse} !important;
  }
  
  .deploy-id {
    font-family: monospace;
    font-size: 12px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid ${({ theme }) => `${theme.text.inverse}20`};
    color: ${({ theme }) => theme.text.inverse};
    opacity: 0.8;
  }
`;

const InfoMessage = styled.div`
  background: ${({ theme }) => `${theme.primary}20`};
  color: ${({ theme }) => theme.text.primary};
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
`;

const LoadingMessage = styled.div`
  background: ${({ theme }) => `${theme.primary}20`};
  color: ${({ theme }) => theme.primary};
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  text-align: center;
  
  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid ${({ theme }) => theme.primary};
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-right: 8px;
    vertical-align: middle;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const QRScannerModal = styled.div<{ isOpen: boolean }>`
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  align-items: center;
  justify-content: center;
`;

const QRScannerContent = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 16px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: auto;
`;

const QRScannerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const QRScannerTitle = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.text.primary};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${({ theme }) => theme.text.secondary};
  
  &:hover {
    color: ${({ theme }) => theme.text.primary};
  }
`;

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
  background: ${({ theme }) => theme.surface};
`;

const Video = styled.video`
  width: 100%;
  height: auto;
  display: block;
`;

const InputWithButton = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-end;
`;

const ScanButton = styled(Button)`
  height: 48px;
  padding: 0 16px;
  white-space: nowrap;
  margin-bottom: 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 0;
`;

const ESTIMATED_GAS_FEE = 0.001;

export const Send: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedAccount, selectedNetwork, isLoading, error } = useSelector(
    (state: RootState) => state.wallet
  );
  const { unlockedAccounts, requirePasswordForTransaction } = useSelector(
    (state: RootState) => state.auth
  );

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [txHash, setTxHash] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isWaitingForBalance, setIsWaitingForBalance] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanError, setScanError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    
    if (!value.trim()) {
      setValidationError('');
      return;
    }
    
    const amountValue = parseFloat(value);
    if (isNaN(amountValue) || amountValue <= 0) {
      return;
    }
    
    const balance = parseFloat(selectedAccount?.balance || '0');
    
    if (amountValue > balance) {
      setValidationError(`Insufficient balance. You have ${balance.toFixed(8)} ${getTokenDisplayName()}`);
      return;
    }
    
    const totalRequired = amountValue + ESTIMATED_GAS_FEE;
    if (totalRequired > balance) {
      const maxSendable = Math.max(0, balance - ESTIMATED_GAS_FEE);
      // Round down to avoid floating point precision issues
      const maxRounded = Math.floor(maxSendable * 100000000) / 100000000;
      setValidationError(
        `Amount + fee (${totalRequired.toFixed(8)}) exceeds balance. Max: ${maxRounded.toFixed(8)} ${getTokenDisplayName()}`
      );
      return;
    }
    
    setValidationError('');
  };
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  const validateRecipientAddress = (address: string): void => {
    const {validationMessages} = addressValidation(address);
    setValidationError(validationMessages?.[0] ?? '')
    setRecipient(address);
  }

  // Fetch balance on mount and when selected account changes
  useEffect(() => {
    if (selectedAccount && selectedNetwork) {
      dispatch(fetchBalance({ account: selectedAccount, network: selectedNetwork }) as any);
    }
  }, [selectedAccount, selectedNetwork, dispatch]);

  useEffect(() => {
    if (!selectedAccount || !selectedNetwork) return;

    const interval = setInterval(() => {
      dispatch(fetchBalance({ account: selectedAccount, network: selectedNetwork }) as any);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedAccount, selectedNetwork, dispatch]);

  // Initialize QR scanner when modal opens
  useEffect(() => {
    if (showQRScanner && videoRef.current) {
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code detected:', result);
          validateRecipientAddress(result.data);
          setShowQRScanner(false);
          setScanError('');
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );
      
      qrScannerRef.current = qrScanner;
      qrScanner.start().catch(err => {
        console.error('Failed to start QR scanner:', err);
        setScanError('Failed to access camera. Please check permissions.');
      });
    }
    
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
    };
  }, [showQRScanner]);

  // Handle paste from clipboard
  const handlePasteImage = async () => {
    try {
      setScanError('');
      
      // Check if clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.read) {
        setScanError('Clipboard access not supported in this browser');
        setTimeout(() => setScanError(''), 3000);
        return;
      }
      
      const clipboardItems = await navigator.clipboard.read();
      
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            
            try {
              const result = await QrScanner.scanImage(blob, {
                returnDetailedScanResult: true,
              });
              
              if (result.data) {
                validateRecipientAddress(result.data);
                return;
              }
            } catch (error) {
              console.error('Failed to scan QR code from clipboard image:', error);
            }
          }
        }
      }
      
      setScanError('No QR code found in clipboard. Copy a QR code image and try again.');
      setTimeout(() => setScanError(''), 3000);
    } catch (error) {
      console.error('Failed to access clipboard:', error);
      setScanError('Failed to access clipboard. Please check permissions.');
      setTimeout(() => setScanError(''), 3000);
    }
  };

  // Handle paste event on the input field
  const handleInputPaste = async (event: React.ClipboardEvent<HTMLInputElement>) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        event.preventDefault();
        const blob = items[i].getAsFile();
        if (blob) {
          try {
            const result = await QrScanner.scanImage(blob, {
              returnDetailedScanResult: true,
            });
            
            if (result.data) {
              validateRecipientAddress(result.data);
            }
          } catch (error) {
            console.error('Failed to scan QR code from pasted image:', error);
            setScanError('No QR code found in the image.');
            setTimeout(() => setScanError(''), 3000);
          }
        }
      }
    }
  };

  // Check if selected account is unlocked
  const isAccountUnlocked = selectedAccount && unlockedAccounts.some(a => a.id === selectedAccount.id);
  const needsPassword = !isAccountUnlocked || requirePasswordForTransaction;

  console.log('Send Debug:', {
    selectedAccount: selectedAccount?.id,
    unlockedAccounts: unlockedAccounts.map(a => a.id),
    isAccountUnlocked,
    requirePasswordForTransaction,
    needsPassword
  });

  const validateForm = () => {
    if (!recipient.trim()) {
      setValidationError('Recipient address is required');
      return false;
    }
    
    if (selectedAccount && recipient.toLowerCase() === selectedAccount.address.toLowerCase()) {
      setValidationError('Cannot send to the same address (self-transfer not allowed)');
      return false;
    }
    
    if (!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setValidationError('Valid amount is required');
      return false;
    }
    
    const balance = parseFloat(selectedAccount?.balance || '0');
    const amountToSend = parseFloat(amount);
    
    if (amountToSend > balance) {
      setValidationError(`Insufficient balance. You have ${balance.toFixed(8)} ${getTokenDisplayName()}`);
      return false;
    }
    
    const totalRequired = amountToSend + ESTIMATED_GAS_FEE;
    if (totalRequired > balance) {
      const maxSendable = Math.max(0, balance - ESTIMATED_GAS_FEE);
      setValidationError(
        `Insufficient balance for transaction + fee. Maximum sendable: ${maxSendable.toFixed(8)} ${getTokenDisplayName()} (${balance.toFixed(8)} - ${ESTIMATED_GAS_FEE.toFixed(8)} fee)`
      );
      return false;
    }
    
    if (needsPassword && !password.trim()) {
      setValidationError('Password is required');
      return false;
    }
    
    setValidationError('');
    return true;
  };

  const handleSendClick = () => {
    if (!validateForm() || !selectedAccount) return;
    setShowConfirmation(true);
  };

  const handleConfirmSend = async (passwordFromModal?: string) => {
    if (!selectedAccount) return;

    setShowConfirmation(false);
    
    // Clear previous transaction state
    setTxHash('');
    setIsWaitingForBalance(false);

    try {
      const resultAction = await dispatch(
        sendTransaction({
          from: selectedAccount,
          to: recipient,
          amount,
          password: passwordFromModal,
          network: selectedNetwork,
        }) as any
      );

      if (sendTransaction.fulfilled.match(resultAction)) {
        const deployId = resultAction.payload.deployId;
        setTxHash(deployId);
        setIsWaitingForBalance(true);
        setRecipient('');
        setAmount('');
        setPassword('');
        
        try {
          console.log('[Send] Force refreshing balance after successful transaction...');
          await dispatch(fetchBalance({ account: selectedAccount, network: selectedNetwork, forceRefresh: true }) as any);
        } catch (error) {
          console.warn('[Send] Failed to refresh balance immediately:', error);
        }
        
        let pollCount = 0;
        const maxPolls = 30;
        const initialBalance = selectedAccount.balance;
        
        const pollInterval = setInterval(async () => {
          pollCount++;
          
          try {
            const balanceResult = await dispatch(
              fetchBalance({ account: selectedAccount, network: selectedNetwork, forceRefresh: true }) as any
            );
            
            if (fetchBalance.fulfilled.match(balanceResult)) {
              const newBalance = balanceResult.payload.balance;
              
              if (newBalance !== initialBalance || pollCount >= maxPolls) {
                clearInterval(pollInterval);
                setIsWaitingForBalance(false);
                
                if (newBalance !== initialBalance) {
                  console.log('[Send] Balance updated from', initialBalance, 'to', newBalance);
                } else {
                  console.log('[Send] Balance update timeout - transaction may still be processing');
                  const sentAmount = parseFloat(amount);
                  const fee = ESTIMATED_GAS_FEE;
                  const expectedNewBalance = parseFloat(initialBalance) - sentAmount - fee;
                  
                  if (expectedNewBalance >= 0) {
                    console.log('[Send] Updating balance locally as fallback');
                    dispatch(updateAccountBalance({
                      accountId: selectedAccount.id,
                      balance: expectedNewBalance.toString()
                    }));
                  }
                }
              }
            } else if (fetchBalance.rejected.match(balanceResult)) {
              console.warn('[Send] Balance fetch failed, but transaction was sent successfully');
              
              const sentAmount = parseFloat(amount);
              const fee = ESTIMATED_GAS_FEE;
              const expectedNewBalance = parseFloat(initialBalance) - sentAmount - fee;
              
              if (expectedNewBalance >= 0) {
                console.log('[Send] Updating balance locally due to fetch failure');
                dispatch(updateAccountBalance({
                  accountId: selectedAccount.id,
                  balance: expectedNewBalance.toString()
                }));
              }
              
              if (pollCount >= maxPolls) {
                clearInterval(pollInterval);
                setIsWaitingForBalance(false);
              }
            }
          } catch (error) {
            console.error('[Send] Error during balance polling:', error);
            if (pollCount >= maxPolls) {
              clearInterval(pollInterval);
              setIsWaitingForBalance(false);
            }
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Send failed:', err);
    }
  };

  const maxAmount = () => {
    const balance = parseFloat(selectedAccount?.balance || '0');
    const max = Math.max(0, balance - ESTIMATED_GAS_FEE);
    
    if (max <= 0) {
      setValidationError('Insufficient balance to cover gas fees');
      setAmount('0');
    } else {
      // Round down to avoid floating point precision issues
      const maxRounded = Math.floor(max * 100000000) / 100000000;
      setAmount(maxRounded.toFixed(8));
      setValidationError('');
    }
  };

  if (!selectedAccount) {
    return (
      <SendContainer>
        <Card>
          <CardContent>
            <p>Please select an account first.</p>
            <Button onClick={() => navigate('/accounts')}>Select Account</Button>
          </CardContent>
        </Card>
      </SendContainer>
    );
  }

  return (
    <SendContainer>
      <Card>
        <CardHeader>
          <CardTitle>Send ASI</CardTitle>
        </CardHeader>
        <CardContent>
          {txHash && !isWaitingForBalance && (
            <SuccessMessage>
              <div>Transaction completed successfully!</div>
              <div className="deploy-id">Deploy ID: {txHash}</div>
            </SuccessMessage>
          )}

          {txHash && isWaitingForBalance && (
            <LoadingMessage>
              <div>
                <span className="spinner"></span>
                Transaction sent! Waiting for balance update...
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px', wordBreak: 'break-all' }}>
                Deploy ID: {txHash}
              </div>
            </LoadingMessage>
          )}

          {(error || validationError) && (
            <ErrorMessage>{error || validationError}</ErrorMessage>
          )}

          <BalanceInfo>
            <BalanceAmount>{parseFloat(selectedAccount.balance).toFixed(4)} {getTokenDisplayName()}</BalanceAmount>
            <BalanceLabel>Available Balance</BalanceLabel>
          </BalanceInfo>

          {!isAccountUnlocked && (
            <InfoMessage>
              Account is locked. You'll need to enter your password to send the transaction.
            </InfoMessage>
          )}

          <FormGroup>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Recipient Address
            </label>
            <InputWithButton>
              <div style={{ flex: 1 }}>
                <input
                  id="send-recipient-input"
                  type="text"
                  value={recipient}
                  onChange={(e) => validateRecipientAddress(e.target.value)}
                  onPaste={handleInputPaste}
                  placeholder={`Enter ${getTokenDisplayName()} address or paste QR code image`}
                  style={{
                    width: '100%',
                    height: '48px',
                    padding: '0 16px',
                    fontSize: '16px',
                    border: `2px solid ${validationError && !recipient ? '#ff4d4f' : '#e0e0e0'}`,
                    borderRadius: '8px',
                    background: 'transparent',
                    color: 'inherit',
                    outline: 'none',
                  }}
                />
              </div>
              <ButtonGroup>
                <ScanButton
                  id="send-qr-scan-button"
                  variant="ghost"
                  onClick={() => setShowQRScanner(true)}
                  title="Scan QR Code with Camera"
                >
                  📷
                </ScanButton>
                <ScanButton
                  id="send-qr-paste-button"
                  variant="ghost"
                  onClick={handlePasteImage}
                  title="Paste QR Code from Clipboard"
                >
                  Paste
                </ScanButton>
              </ButtonGroup>
            </InputWithButton>
            {scanError && (
              <div style={{ marginTop: '8px', color: '#ff4d4f', fontSize: '14px' }}>
                {scanError}
              </div>
            )}
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
              Tip: Copy a QR code image and paste it directly in the field or click the Paste button
            </div>
          </FormGroup>

          <FormGroup>
            <Input
              id="send-amount-input"
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Enter amount"
              step="0.00000001"
              min="0"
              max={selectedAccount.balance}
            />
            <Button 
              id="send-max-amount-button"
              variant="ghost" 
              size="small" 
              onClick={maxAmount}
              style={{ marginTop: '8px' }}
            >
              Max
            </Button>
          </FormGroup>

          {needsPassword && (
            <FormGroup>
              <Input
                id="send-password-input"
                label={requirePasswordForTransaction ? "Transaction Password" : "Account Password"}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </FormGroup>
          )}

          <ActionButtons>
            <Button variant="ghost" onClick={() => navigate('/')}>
              Cancel
            </Button>
            <Button
              id="send-transaction-button"
              onClick={handleSendClick}
              loading={isLoading}
              disabled={!recipient || !amount || (needsPassword && !password) || !!validationError}
            >
              Send Transaction
            </Button>
          </ActionButtons>
        </CardContent>
      </Card>
      
      {/* QR Scanner Modal */}
      <QRScannerModal isOpen={showQRScanner}>
        <QRScannerContent>
          <QRScannerHeader>
            <QRScannerTitle>Scan QR Code</QRScannerTitle>
            <CloseButton onClick={() => setShowQRScanner(false)}>
              ×
            </CloseButton>
          </QRScannerHeader>
          
          {scanError ? (
            <ErrorMessage>{scanError}</ErrorMessage>
          ) : (
            <VideoContainer>
              <Video ref={videoRef} />
            </VideoContainer>
          )}
          
          <div style={{ marginTop: '16px', textAlign: 'center', color: '#999' }}>
            <small>Position the QR code within the frame to scan</small>
          </div>
        </QRScannerContent>
      </QRScannerModal>

      {/* Transaction Confirmation Modal */}
      <TransactionConfirmationModal
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setPassword('');
        }}
        onConfirm={handleConfirmSend}
        amount={amount}
        recipient={recipient}
        senderAddress={selectedAccount?.revAddress || ''}
        senderName={selectedAccount?.name || ''}
        loading={isLoading}
        needsPassword={needsPassword}
        requirePasswordForTransaction={requirePasswordForTransaction}
      />
    </SendContainer>
  );
};