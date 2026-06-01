import React, { useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { RootState } from "store";
import { Card, PrivateKeyDisplay, PasswordModal } from "components";
import { CustomNetworkConfig } from "./CustomNetworkConfig";
import { SecureStorage } from "services/secureStorage";

const SettingsContainer = styled.div`
    max-width: 800px;
    margin: 0 auto;
`;

export const Settings: React.FC = () => {
    const { accounts } = useSelector((state: RootState) => state.wallet);
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [selectedAccountForPrivateKey, setSelectedAccountForPrivateKey] =
        useState<string | null>(null);
    const [privateKeyPassword, setPrivateKeyPassword] = useState("");
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const handleViewPrivateKey = (accountId: string) => {
        setSelectedAccountForPrivateKey(accountId);
        setShowPasswordModal(true);
    };

    const handlePasswordSubmit = async (password: string) => {
        if (selectedAccountForPrivateKey) {
            const account = await SecureStorage.unlockAccount(
                selectedAccountForPrivateKey,
                password,
            );
            if (account?.privateKey) {
                setPrivateKeyPassword(password);
                setShowPasswordModal(false);
                setShowPrivateKey(true);
            } else {
                alert("Invalid password");
            }
        }
    };

    const handlePrivateKeyClose = () => {
        setShowPrivateKey(false);
        setSelectedAccountForPrivateKey(null);
        setPrivateKeyPassword("");
    };

    return (
        <SettingsContainer>
            <CustomNetworkConfig />

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
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        padding: "20px",
                    }}
                >
                    <div style={{ maxWidth: "600px", width: "100%" }}>
                        <PrivateKeyDisplay
                            privateKey={
                                SecureStorage.getUnlockedAccount(
                                    selectedAccountForPrivateKey ?? "",
                                )?.privateKey ?? ""
                            }
                            accountName={
                                accounts.find(
                                    (acc) =>
                                        acc.id === selectedAccountForPrivateKey,
                                )?.name || ""
                            }
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
