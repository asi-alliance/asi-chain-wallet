import React, { FormEvent, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import {
    Alert, Button, Card, CardContent, CardHeader, CardTitle, Input,
    PageContent, PageGrid,
} from "components";
import { getAddressLabel } from "constants/token";
import { selectIsAuthenticated } from "store/Auth";
import { selectActiveWallet } from "store/WalletsStore";
import { generateKeyPair, importPrivateKey, KeyPair } from "utils/crypto";

const Page = styled(PageContent)`
    max-width: ${({ theme }) => theme.layout.contentWide};
`;
const Heading = styled.h1`
    margin: 0 0 ${({ theme }) => theme.spacing.lg};
    color: ${({ theme }) => theme.text.primary};
    font-size: ${({ theme }) => theme.typography.size.display};
    line-height: ${({ theme }) => theme.typography.lineHeight.display};
`;
const Intro = styled.p`
    margin: 0 0 ${({ theme }) => theme.spacing["3xl"]};
    color: ${({ theme }) => theme.text.secondary};
`;
const Cards = styled(PageGrid)`
    margin-top: ${({ theme }) => theme.spacing["3xl"]};
    align-items: start;
`;
const CardHeading = styled(CardTitle)`
    font-size: ${({ theme }) => theme.typography.size.xl};
    line-height: ${({ theme }) => theme.typography.lineHeight.xl};
`;
const Description = styled.p`
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
`;
const FieldStack = styled.div`
    display: grid;
    gap: ${({ theme }) => theme.spacing.xl};
`;
const FieldActions = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.spacing.md};
    margin-top: ${({ theme }) => theme.spacing.md};
`;
const Result = styled(Card)`
    margin-top: ${({ theme }) => theme.spacing["3xl"]};
`;
const ResultHeading = styled(CardHeader)`
    gap: ${({ theme }) => theme.spacing.xl};
    flex-wrap: wrap;
`;
const Message = styled.p`
    margin: ${({ theme }) => theme.spacing.lg} 0 0;
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.size.sm};
`;

type KeySource = "generated" | "imported";

// A syntactically valid 32-byte value still has to be a secp256k1 scalar.
const SECP256K1_ORDER = BigInt(
    "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141",
);

const normalizePrivateKey = (value: string): string | null => {
    const hex = value.trim().replace(/^0x/i, "");
    if (!/^[0-9a-fA-F]{64}$/.test(hex)) return null;
    const scalar = BigInt(`0x${hex}`);
    return scalar > 0n && scalar < SECP256K1_ORDER ? hex : null;
};

export const KeyGenerator: React.FC = () => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const activeWallet = useSelector(selectActiveWallet);
    const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
    const [source, setSource] = useState<KeySource | null>(null);
    const [importValue, setImportValue] = useState("");
    const [importError, setImportError] = useState("");
    const [actionError, setActionError] = useState("");
    const [copyMessage, setCopyMessage] = useState("");
    const [busy, setBusy] = useState(false);
    const busyRef = useRef(false);
    const operationRef = useRef(0);
    const authenticatedRef = useRef(isAuthenticated);
    const walletIdRef = useRef(activeWallet?.id);

    const clearResult = () => {
        operationRef.current += 1;
        setKeyPair(null);
        setSource(null);
        setImportValue("");
        setImportError("");
        setCopyMessage("");
        setActionError("");
        setBusy(false);
        busyRef.current = false;
    };

    useEffect(() => {
        authenticatedRef.current = isAuthenticated;
        if (!isAuthenticated) clearResult();
        // The route normally unmounts as soon as the wallet locks.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    useEffect(() => {
        if (walletIdRef.current !== activeWallet?.id) clearResult();
        walletIdRef.current = activeWallet?.id;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeWallet?.id]);

    useEffect(() => () => {
        authenticatedRef.current = false;
        operationRef.current += 1;
    }, []);

    const runKeyAction = async (action: () => KeyPair, nextSource: KeySource) => {
        if (busyRef.current || !authenticatedRef.current) return;
        busyRef.current = true;
        setBusy(true);
        setActionError("");
        setImportError("");
        setCopyMessage("");
        const operation = operationRef.current;

        try {
            const keys = await Promise.resolve().then(action);
            if (operation !== operationRef.current || !authenticatedRef.current) return;
            setKeyPair(keys);
            setSource(nextSource);
            setImportValue("");
        } catch {
            if (operation === operationRef.current && authenticatedRef.current) {
                setActionError("Could not prepare key details. Please try again.");
            }
        } finally {
            if (operation === operationRef.current) {
                busyRef.current = false;
                if (authenticatedRef.current) setBusy(false);
            }
        }
    };

    const handleImport = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (busyRef.current) return;
        const hex = normalizePrivateKey(importValue);
        if (!hex) {
            setImportError("Enter a valid 64-character hexadecimal private key.");
            return;
        }
        void runKeyAction(() => importPrivateKey(hex), "imported");
    };

    const copy = async (value: string, name: string) => {
        setCopyMessage("");
        try {
            await navigator.clipboard.writeText(value);
            if (authenticatedRef.current) setCopyMessage(`${name} copied.`);
        } catch {
            if (authenticatedRef.current) setCopyMessage(`Could not copy ${name.toLowerCase()}.`);
        }
    };

    const resultFields = keyPair ? [
        { label: "Private key", value: keyPair.privateKey },
        { label: "Public key", value: keyPair.publicKey },
        { label: "Ethereum address", value: keyPair.ethAddress },
        { label: getAddressLabel(), value: keyPair.revAddress },
    ] : [];

    return (
        <Page>
            <Heading>Keys</Heading>
            <Intro>Generate a keypair or inspect an existing private key and its public addresses.</Intro>
            <Alert tone="info">
                Generate new keypairs or derive addresses from existing private keys.
                The ETH address is compatible with MetaMask and all Ethereum wallets.
                The {getAddressLabel()} is specific to the RChain network.
            </Alert>

            <Cards>
                <Card>
                    <CardHeader><CardHeading as="h2">Generate keypair</CardHeading></CardHeader>
                    <CardContent>
                        <Description>
                            Create a new random keypair for inspection. Save your private key securely.
                        </Description>
                        <Button
                            type="button"
                            onClick={() => void runKeyAction(generateKeyPair, "generated")}
                            loading={busy}
                            disabled={busy}
                        >
                            Generate keypair
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardHeading as="h2">Import private key</CardHeading></CardHeader>
                    <CardContent>
                        <Description>Derive public data from a 32-byte secp256k1 private key.</Description>
                        <form onSubmit={handleImport}>
                            <Input
                                id="keys-import-private-key"
                                label="Private key"
                                autoComplete="off"
                                spellCheck={false}
                                value={importValue}
                                onChange={(event) => {
                                    setImportValue(event.target.value);
                                    setImportError("");
                                }}
                                error={importError}
                                placeholder="64 hexadecimal characters"
                                disabled={busy}
                            />
                            <FieldActions>
                                <Button type="submit" loading={busy} disabled={busy}>
                                    Import private key
                                </Button>
                            </FieldActions>
                        </form>
                    </CardContent>
                </Card>
            </Cards>

            {actionError && <Alert tone="danger">{actionError}</Alert>}

            {keyPair && isAuthenticated && (
                <Result aria-label="Key details">
                    <ResultHeading>
                        <CardHeading as="h2">
                            {source === "generated" ? "Generated key details" : "Imported key details"}
                        </CardHeading>
                    </ResultHeading>
                    <CardContent>
                        <FieldStack>
                            {resultFields.map(({ label, value }) => (
                                <div key={label}>
                                    <Input
                                        label={label}
                                        value={value}
                                        readOnly
                                        onFocus={(event) => event.currentTarget.select()}
                                    />
                                    <FieldActions>
                                        <Button
                                            type="button"
                                            size="small"
                                            variant="ghost"
                                            onClick={() => void copy(value, label)}
                                        >
                                            Copy {label.toLowerCase()}
                                        </Button>
                                    </FieldActions>
                                </div>
                            ))}
                        </FieldStack>
                        <Message role="status" aria-live="polite">{copyMessage}</Message>
                    </CardContent>
                </Result>
            )}
        </Page>
    );
};
