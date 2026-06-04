import React, { Fragment, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled, { DefaultTheme } from "styled-components";
import { QRCodeCanvas } from "qrcode.react";
import { RootState } from "store";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Input,
} from "components";
import { getAddressLabel, getTokenDisplayName } from "../../constants/token";
import { AccountSelector } from "components/AccountSelector";
import { Select } from "components/Select";
import { ISelectOption } from "components/Select/Select";
import { AccountBalance } from "components/AccountBalance";
import {
    CopyIcon,
    FileCopyIcon,
    HistoryIcon,
    QRIconSecond,
} from "components/Icons";
import { Panel } from "components/Panel";
import { useScreen } from "hooks/";

const ReceiveContainer = styled.div`
    max-width: 600px;
    margin: 0 auto;
`;

const AddressContainer = styled.div`
    background: ${({ theme }) => theme.surface};
    border-radius: 12px;
    margin-bottom: 24px;
`;

const CopyButton = styled(Button)`
    margin-top: 16px;
`;

const QRCodeContainer = styled.div`
    width: 256px;
    height: 256px;
    padding: 16px;
    background: white;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 24px auto;
    box-shadow: ${({ theme }) => theme.shadowLarge};
`;

const TabContainer = styled.div`
    display: flex;
    margin-bottom: 24px;
    border-bottom: 2px solid ${({ theme }) => theme.border};
`;

const Tab = styled.button<{ active: boolean }>`
    flex: 1;
    padding: 12px 16px;
    background: none;
    border: none;
    border-bottom: 2px solid
        ${({ active, theme }) => (active ? theme.primary : "transparent")};
    color: ${({ active, theme }) =>
        active ? theme.primary : theme.text.secondary};
    font-weight: ${({ active }) => (active ? "600" : "400")};
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        color: ${({ theme }) => theme.primary};
    }
`;

const SuccessMessage = styled.div`
    background: ${({ theme }) => theme.success};
    color: ${({ theme }) => theme.text.inverse};
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    text-align: center;
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
    // font-size: 16px;
    color: ${({ theme }) => theme.text.primary};
`;

const InfoList = styled.ul`
    margin: 0;
    padding-left: 20px;
    // font-size: 14px;
    color: ${({ theme }) => theme.text.secondary};
`;

const SelectToolbar = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    gap: 24px;

    margin-bottom: 36px;

    @media (max-width: 768px) {
        display: block;
    }
`;

const FilterGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const FilterLabel = styled.label`
    // font-size: 14px;
    font-weight: 500;
    color: ${({ theme }) => theme.text.secondary};
`;

const BalanceInfo = styled.div`
    margin-bottom: 36px;
    display: flex;
    justify-content: center;
`;

const ActionsToolbar = styled.div`
    display: flex;
    padding: 0 20px;
    justify-content: center;
    align-items: center;
    gap: 16px;
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
    {
        id: AddressFormats.ETHEREUM,
        value: AddressFormats.ETHEREUM,
        label: "ETH",
    },
];

export const Receive: React.FC = () => {
    const navigate = useNavigate();
    const { selectedAccount, selectedNetwork } = useSelector(
        (state: RootState) => state.wallet,
    );

    const { isLaptop } = useScreen();

    const [addressFormat, setAddressFormat] = useState<AddressFormats>(
        AddressFormats.ASI,
    );
    const [copyMessage, setCopyMessage] = useState("");

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopyMessage("Address copied to clipboard!");
            setTimeout(() => setCopyMessage(""), 3000);
        });
    };

    const accountSelectorStyle = useMemo(
        () => ({
            flex: 1,
            ...(isLaptop && { marginBottom: "16px" }),
        }),
        [isLaptop],
    );

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

    const currentAddress =
        addressFormat === AddressFormats.ASI
            ? selectedAccount.address
            : selectedAccount.ethAddress;
    const addressLabel =
        addressFormat === AddressFormats.ASI ? "ASI Address" : "ETH Address";

    console.log("IS LAPTOP: ", isLaptop);

    return (
        <ReceiveContainer>
            <Card>
                <CardHeader>
                    <CardTitle>
                        <h1>Receive Tokens</h1>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {copyMessage && (
                        <SuccessMessage>{copyMessage}</SuccessMessage>
                    )}

                    <SelectToolbar>
                        <AccountSelector wrapperStyle={accountSelectorStyle} />
                        <FilterGroup style={{ flex: 1 }}>
                            <FilterLabel>
                                <h4 className="light">Address Format</h4>
                            </FilterLabel>
                            <Select
                                id="address-format-account-select"
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
                        <AccountBalance
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
                            labelColorSelector={(theme: DefaultTheme) =>
                                theme.colors.text.primary
                            }
                            wrapperStyle={{
                                marginBottom: "4px",
                            }}
                            style={{
                                fontSize: "0.75rem",
                                height: "44px",
                            }}
                            value={currentAddress}
                            readOnly
                            copyable
                            CustomCopyIcon={FileCopyIcon}
                        />

                        <div
                            style={{
                                marginBottom: "36px",
                                fontSize: "0.75rem",
                                color: "#666",
                            }}
                        >
                            Tip: Copy a QR code image and paste it directly in
                            the field or click the Paste button
                        </div>

                        <Panel header="Show QR Code">
                            <QRCodeContainer>
                                <QRCodeCanvas
                                    value={currentAddress}
                                    size={224}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                    level="H"
                                    includeMargin={false}
                                />
                            </QRCodeContainer>
                        </Panel>
                    </AddressContainer>

                    <InfoBox>
                        <InfoTitle>
                            <h3 style={{ fontWeight: "500" }}>Important:</h3>
                        </InfoTitle>
                        <InfoList>
                            <div className="text-2">
                                <li>
                                    Only send {getTokenDisplayName()} tokens to
                                    the {getAddressLabel()}
                                </li>
                                <li>
                                    The ETH address is for compatibility -
                                    mainly for address derivation
                                </li>
                                <li>
                                    Always double-check the address before
                                    sending
                                </li>
                                <li>
                                    Make sure you're on the correct network:{" "}
                                    <span id="receive-network-name">
                                        {selectedNetwork.name}
                                    </span>
                                </li>
                            </div>
                        </InfoList>
                    </InfoBox>

                    {!isLaptop && (
                        <ActionsToolbar>
                            <CopyButton
                                variant="primary"
                                onClick={() => copyToClipboard(currentAddress)}
                                style={{
                                    marginTop: "0",
                                }}
                            >
                                <h3>Copy {addressLabel}</h3>
                                <CopyIcon size={24} color="currentColor" />
                            </CopyButton>

                            <Button
                                variant="secondary"
                                onClick={() => {
                                    const canvas =
                                        document.querySelector("canvas");
                                    if (canvas) {
                                        const url =
                                            canvas.toDataURL("image/png");
                                        const link =
                                            document.createElement("a");
                                        link.download = `${addressLabel
                                            .toLowerCase()
                                            .replace(" ", "-")}-address-qr.png`;
                                        link.href = url;
                                        link.click();
                                    }
                                }}
                            >
                                <h3>Download QR</h3>
                                <QRIconSecond size={24} color="currentColor" />
                            </Button>
                            <Button
                                id="history-button"
                                onClick={() => {
                                    navigate("/history");
                                }}
                                variant="icon-button-black"
                                fullWidth={false}
                            >
                                <HistoryIcon />
                            </Button>
                        </ActionsToolbar>
                    )}
                    {isLaptop && (
                        <Fragment>
                            <ActionsToolbar style={{ marginBottom: "16px" }}>
                                <CopyButton
                                    variant="primary"
                                    onClick={() =>
                                        copyToClipboard(currentAddress)
                                    }
                                    style={{
                                        marginTop: "0",
                                    }}
                                    fullWidth
                                >
                                    <h3>Copy {addressLabel}</h3>
                                    <CopyIcon size={24} color="currentColor" />
                                </CopyButton>
                                <Button
                                    id="history-button"
                                    onClick={() => {
                                        navigate("/history");
                                    }}
                                    variant="icon-button-black"
                                    fullWidth={false}
                                >
                                    <HistoryIcon />
                                </Button>
                            </ActionsToolbar>
                            <ActionsToolbar>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        const canvas =
                                            document.querySelector("canvas");
                                        if (canvas) {
                                            const url =
                                                canvas.toDataURL("image/png");
                                            const link =
                                                document.createElement("a");
                                            link.download = `${addressLabel
                                                .toLowerCase()
                                                .replace(
                                                    " ",
                                                    "-",
                                                )}-address-qr.png`;
                                            link.href = url;
                                            link.click();
                                        }
                                    }}
                                    fullWidth
                                >
                                    <h3>Download QR</h3>
                                    <QRIconSecond
                                        size={24}
                                        color="currentColor"
                                    />
                                </Button>
                            </ActionsToolbar>
                        </Fragment>
                    )}
                </CardContent>
            </Card>
        </ReceiveContainer>
    );
};
