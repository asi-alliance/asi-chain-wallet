import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { QRCodeCanvas } from "qrcode.react";
import { selectSelectedAccount, selectSelectedNetwork } from "store/WalletsStore";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Input,
} from "components";
import { getAddressLabel, getTokenDisplayName } from "../../constants/token";
import { TextSecondaryBlock } from "styles/sharedStyledComponents";
import { AccountSelector } from "components/AccountSelector";
import { Select } from "components/Select";
import { ISelectOption } from "components/Select/Select";
import { ASIAccountBalance } from "components/ASIAccountBalance";
import {
    CopyIcon,
    FileCopyIcon,
    HistoryIcon,
    QRIconSecond,
} from "components/Icons";
import { Panel } from "components/Panel";

const ReceiveContainer = styled.div`
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
`;

const ReceiveCard = styled(Card)`
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        h1 {
            font-size: clamp(24px, 8vw, 32px);
            line-height: clamp(30px, 9vw, 36px);
        }
    }
`;

const AddressContainer = styled.div`
    background: ${({ theme }) => theme.surface};
    border-radius: 12px;
    margin-bottom: 24px;
`;

const AddressCopyButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.text.primary};
    cursor: pointer;

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.focusRing};
        outline-offset: 2px;
        border-radius: ${({ theme }) => theme.radii.xs};
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }
`;

const QRCodeContainer = styled.div`
    box-sizing: border-box;
    width: 256px;
    max-width: 100%;
    aspect-ratio: 1;
    padding: 16px;
    background: white;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 24px auto;
    box-shadow: ${({ theme }) => theme.shadowLarge};
`;

const CopyStatus = styled.div`
    color: ${({ theme }) => theme.actionText};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};

    &:not(:empty) {
        margin-bottom: ${({ theme }) => theme.spacing.md};
    }
`;

const CopyError = styled.div`
    color: ${({ theme }) => theme.dangerText};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};

    &:not(:empty) {
        margin-bottom: ${({ theme }) => theme.spacing.md};
    }
`;

const InfoBox = styled.div`
    padding: 11px 20px;
    background: ${({ theme }) => theme.surface};
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.border};

    margin-bottom: 36px;
`;

const InfoTitle = styled.h4`
    margin: 0 0 8px 0;
    font-size: 1rem;
    font-weight: 500;
    color: ${({ theme }) => theme.text.primary};
`;

const InfoList = styled.ul`
    margin: 0;
    padding-left: 20px;
    color: ${({ theme }) => theme.text.secondary};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        font-size: ${({ theme }) => theme.typography.size.sm};
    }
`;

const SelectToolbar = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    gap: 24px;
    margin-bottom: 36px;

    > * {
        flex: 1;
        min-width: 0;
    }

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        flex-direction: column;
        align-items: stretch;
        gap: ${({ theme }) => theme.spacing.xl};
    }
`;

const FilterGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const FilterLabel = styled.span`
    font-size: ${({ theme }) => theme.typography.size.md};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
    font-weight: 500;
    color: ${({ theme }) => theme.text.secondary};
`;

const BalanceInfo = styled.div`
    margin-bottom: 36px;
    display: flex;
    justify-content: center;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        max-width: 100%;

        .account-balance-card {
            max-width: 100%;
        }

        .amount-balance-wrapper {
            white-space: nowrap;
        }

        .amount-balance-info-wrapper > span:first-child {
            font-size: clamp(24px, 7vw, 30px);
        }

        .amount-balance-info-wrapper > span:nth-child(2) {
            font-size: clamp(16px, 4.5vw, 20px);
        }
    }
`;

const ActionsToolbar = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    padding: 0 20px;
    align-items: center;
    gap: 16px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: minmax(0, 1fr) auto;

        > button:first-child {
            grid-column: 1 / -1;
            grid-row: 1;
        }

        .download-qr {
            grid-column: 1;
            grid-row: 2;
        }

        .history-button {
            grid-column: 2;
            grid-row: 2;
        }
    }

    @media (max-width: 400px) {
        padding: 0;
        gap: ${({ theme }) => theme.spacing.md};
    }
`;

enum AddressFormats {
    ASI = "asi",
    ETHEREUM = "ethereum",
}

const formatOptions: ISelectOption[] = [
    {
        id: AddressFormats.ASI,
        value: AddressFormats.ASI,
        label: "ASI",
    },
    // TODO: Restore the ETH format option when the SDK exposes the account ETH address.
    // {
    //     id: AddressFormats.ETHEREUM,
    //     value: AddressFormats.ETHEREUM,
    //     label: "ETH",
    // },
];

interface CopyRequest {
    address: string;
    generation: number;
    completed: boolean;
    repairInFlight: boolean;
    repairAgain: boolean;
}

export const Receive: React.FC = () => {
    const navigate = useNavigate();
    const selectedAccount = useSelector(selectSelectedAccount);
    const selectedNetwork = useSelector(selectSelectedNetwork);
    const address = selectedAccount?.address ?? "";
    const addressLabel = getAddressLabel();
    const contextKey = JSON.stringify([
        selectedAccount?.id ?? null,
        selectedNetwork.id,
        address,
    ]);
    const [addressFormat, setAddressFormat] = useState<AddressFormats>(AddressFormats.ASI);
    const [isQrExpanded, setIsQrExpanded] = useState(false);
    const [copySuccess, setCopySuccess] = useState<{ address: string } | null>(
        null,
    );
    const [copyError, setCopyError] = useState("");
    const [isCopying, setIsCopying] = useState(false);
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
    const copyGenerationRef = useRef(0);
    const copyingRef = useRef(false);
    const latestCopyRef = useRef<CopyRequest | null>(null);

    useLayoutEffect(() => {
        copyGenerationRef.current += 1;
        copyingRef.current = false;
        latestCopyRef.current = null;
        setIsCopying(false);
        setCopySuccess(null);
        setCopyError("");

        return () => {
            copyGenerationRef.current += 1;
            copyingRef.current = false;
            latestCopyRef.current = null;
        };
    }, [contextKey]);

    useEffect(() => {
        if (!copySuccess) return undefined;

        const timeoutId = window.setTimeout(() => setCopySuccess(null), 2000);
        return () => window.clearTimeout(timeoutId);
    }, [copySuccess]);

    function repairClipboard(request: CopyRequest): void {
        if (request.repairInFlight) {
            request.repairAgain = true;
            return;
        }
        request.repairInFlight = true;
        copyingRef.current = true;
        setIsCopying(true);
        setCopySuccess(null);
        void writeAddress(request, true);
    }

    async function writeAddress(
        request: CopyRequest,
        isRepair = false,
    ): Promise<void> {
        let succeeded = false;
        try {
            // Call writeText before the first await so the click's user activation is available.
            await navigator.clipboard.writeText(request.address);
            succeeded = true;
            if (request !== latestCopyRef.current) {
                const latest = latestCopyRef.current;
                if (latest?.completed && latest.generation === copyGenerationRef.current) {
                    // An older write may have replaced the new address after it succeeded.
                    repairClipboard(latest);
                }
            } else if (request.generation === copyGenerationRef.current) {
                request.completed = true;
            }
        } catch {
            // The current request reports this failure below; stale failures are ignored.
        } finally {
            if (isRepair) request.repairInFlight = false;
            if (
                request === latestCopyRef.current &&
                request.generation === copyGenerationRef.current
            ) {
                if (isRepair && request.repairAgain) {
                    request.repairAgain = false;
                    repairClipboard(request);
                    return;
                }
                if (succeeded) {
                    setCopySuccess({ address: request.address });
                    setCopyError("");
                } else {
                    setCopySuccess(null);
                    setCopyError("Could not copy the address.");
                }
                copyingRef.current = false;
                setIsCopying(false);
            }
        }
    }

    const copyAddress = (): void => {
        if (!address || copyingRef.current) return;

        const request: CopyRequest = {
            address,
            generation: copyGenerationRef.current,
            completed: false,
            repairInFlight: false,
            repairAgain: false,
        };
        latestCopyRef.current = request;
        copyingRef.current = true;
        setIsCopying(true);
        setCopySuccess(null);
        setCopyError("");
        void writeAddress(request);
    };

    const downloadQr = (): void => {
        const canvas = qrCanvasRef.current;
        if (!canvas) return;

        const link = document.createElement("a");
        link.download = `${addressLabel.toLowerCase().replace(" ", "-")}-address-qr.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    if (!selectedAccount) {
        return (
            <ReceiveContainer>
                <Card>
                    <CardContent>
                        <p>Please select an account first.</p>
                        <Button onClick={() => navigate("/accounts")}>
                            Select Account
                        </Button>
                    </CardContent>
                </Card>
            </ReceiveContainer>
        );
    }

    return (
        <ReceiveContainer>
            <ReceiveCard>
                <CardHeader>
                    <CardTitle>Receive Tokens</CardTitle>
                </CardHeader>
                <CardContent>
                    <SelectToolbar>
                        <AccountSelector fullWidth label="Account" />
                        <FilterGroup>
                            <FilterLabel id="address-format-selector-label">
                                Address Format
                            </FilterLabel>
                            <Select
                                id="address-format-account-select"
                                aria-labelledby="address-format-selector-label"
                                value={addressFormat}
                                onChange={(format) => {
                                    setAddressFormat(format as AddressFormats);
                                }}
                                placeholder="Select format"
                                options={formatOptions}
                            />
                        </FilterGroup>
                    </SelectToolbar>

                    <BalanceInfo className="balance-info">
                        <ASIAccountBalance
                            account={selectedAccount}
                            style={{ marginBottom: "0" }}
                        />
                    </BalanceInfo>

                    <AddressContainer>
                        <Input
                            id="address-input"
                            className="address-input text-3"
                            label={addressLabel}
                            labelStyle={{
                                fontWeight: "500",
                            }}
                            labelColorSelector={(theme) => theme.text.primary}
                            wrapperStyle={{
                                marginBottom: "4px",
                            }}
                            style={{
                                fontSize: "0.75rem",
                                height: "44px",
                            }}
                            value={address}
                            readOnly
                            endAdornment={
                                <AddressCopyButton
                                    type="button"
                                    title={`Copy ${addressLabel} from field`}
                                    aria-label={`Copy ${addressLabel} from field`}
                                    onClick={copyAddress}
                                    disabled={isCopying}
                                >
                                    <FileCopyIcon size={16} color="currentColor" />
                                </AddressCopyButton>
                            }
                        />

                        <TextSecondaryBlock
                            style={{
                                marginBottom: "36px",
                                fontSize: "0.75rem",
                            }}
                        >
                            Tip: Copy a QR code image and paste it directly in
                            the field or click the Paste button
                        </TextSecondaryBlock>

                        <Panel
                            header={isQrExpanded ? "Hide QR Code" : "Show QR Code"}
                            expanded={isQrExpanded}
                            onToggle={setIsQrExpanded}
                            inlineOnMobile
                        >
                            <QRCodeContainer>
                                <QRCodeCanvas
                                    ref={qrCanvasRef}
                                    value={address}
                                    size={224}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                    level="H"
                                    includeMargin={false}
                                    style={{ width: "100%", height: "auto", minWidth: 0 }}
                                    aria-label={`QR code for ${address}`}
                                />
                            </QRCodeContainer>
                        </Panel>
                    </AddressContainer>

                    <InfoBox>
                        <InfoTitle>Important</InfoTitle>
                        <InfoList>
                            <li>
                                Only send {getTokenDisplayName()} tokens to the{" "}
                                {addressLabel}
                            </li>
                            <li>
                                Always double-check the address before sending
                            </li>
                            <li>
                                Make sure you're on the correct network:{" "}
                                <span id="receive-network-name">
                                    {selectedNetwork.name}
                                </span>
                            </li>
                        </InfoList>
                    </InfoBox>

                    <CopyStatus role="status" aria-live="polite">
                        {copySuccess?.address === address ? "Copied" : ""}
                    </CopyStatus>
                    <CopyError role="alert">{copyError}</CopyError>
                    <ActionsToolbar>
                        <Button
                            type="button"
                            variant="primary"
                            fullWidth
                            loading={isCopying}
                            onClick={copyAddress}
                            aria-label={`Copy ${addressLabel}`}
                        >
                            Copy {addressLabel}
                            <CopyIcon size={24} color="currentColor" />
                        </Button>
                        <Button
                            type="button"
                            className="download-qr"
                            variant="secondary"
                            fullWidth
                            onClick={downloadQr}
                        >
                            Download QR
                            <QRIconSecond size={24} color="currentColor" />
                        </Button>
                        <Button
                            type="button"
                            className="history-button"
                            id="history-button"
                            title="View transaction history"
                            aria-label="View transaction history"
                            variant="icon-button-black"
                            fullWidth={false}
                            secondaryHover
                            onClick={() => navigate("/history")}
                        >
                            <HistoryIcon />
                        </Button>
                    </ActionsToolbar>
                </CardContent>
            </ReceiveCard>
        </ReceiveContainer>
    );
};
