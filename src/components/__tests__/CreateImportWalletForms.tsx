import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { ThemeProvider } from "styled-components";
import { CustomErrorCode } from "@asichain/asi-wallet-sdk";
import { lightTheme } from "styles/theme";
import { PasswordSetup } from "components/PasswordSetup";
import { CreateHdWalletForm } from "components/CreateHdWalletForm";
import { CreatePkWalletForm } from "components/CreatePkWalletForm";
import { ImportHdWalletForm } from "components/ImportHdWalletForm";
import { ImportPkWalletForm } from "components/ImportPkWalletForm";
import { ImportKeyfileWalletForm } from "components/ImportKeyfileWalletForm";
import { ModalWindow } from "components/ModalWindow";
import {
    createHdWallet,
    importHdWallet,
    importPrivateKeyWallet,
} from "store/Auth/thunks";
import { SdkWalletService } from "sdk";

const WORDS_12 = [
    "alpha",
    "bravo",
    "charlie",
    "delta",
    "echo",
    "foxtrot",
    "golf",
    "hotel",
    "india",
    "juliet",
    "kilo",
    "lima",
];

jest.mock("store/Auth/thunks", () => ({
    createHdWallet: jest.fn((payload) => ({
        type: "auth/createHdWallet",
        payload,
    })),
    importHdWallet: jest.fn((payload) => ({
        type: "auth/importHdWallet",
        payload,
    })),
    importPrivateKeyWallet: jest.fn((payload) => ({
        type: "auth/importPrivateKeyWallet",
        payload,
    })),
}));

jest.mock("store/WalletsStore/thunks", () => ({
    importKeyfileAccounts: jest.fn((payload) => ({
        type: "wallets/importKeyfileAccounts",
        payload,
    })),
}));

jest.mock("sdk/client", () => {
    const words12 = [
        "alpha",
        "bravo",
        "charlie",
        "delta",
        "echo",
        "foxtrot",
        "golf",
        "hotel",
        "india",
        "juliet",
        "kilo",
        "lima",
    ];
    const words24 = [
        ...words12,
        "mike",
        "november",
        "oscar",
        "papa",
        "quebec",
        "romeo",
        "sierra",
        "tango",
        "uniform",
        "victor",
        "whiskey",
        "xray",
    ];

    const client = {
        generateMnemonic: (strength?: number) =>
            (strength === 256 ? words24 : words12).join(" "),
        generatePrivateKey: () => new Uint8Array(32).fill(0xab),
    };

    return {
        getSdkClient: () => client,
        requireSdkClient: () => client,
        setSdkClient: jest.fn(),
    };
});

jest.mock("hooks", () => ({
    useValidAccountUpdating: () => ({
        isNameUpdateValid: true,
        nameErrorMessage: undefined,
        updateAccountField: jest.fn(),
        reset: jest.fn(),
    }),
}));

jest.mock("hooks/", () => ({
    useValidAccountUpdating: () => ({
        isNameUpdateValid: true,
        nameErrorMessage: undefined,
        updateAccountField: jest.fn(),
        reset: jest.fn(),
    }),
    useScreen: () => ({ isLaptop: false }),
}));

const createStore = (dispatchImpl?: jest.Mock) => {
    const store = configureStore({
        reducer: {
            walletsStore: () => ({ wallets: [], accounts: [] }),
            auth: () => ({ isLoading: false }),
        },
    });

    if (dispatchImpl) {
        store.dispatch = dispatchImpl as typeof store.dispatch;
    }

    return store;
};

const renderWithProviders = (
    node: React.ReactElement,
    dispatchImpl?: jest.Mock,
) =>
    render(
        <Provider store={createStore(dispatchImpl)}>
            <ThemeProvider theme={lightTheme}>{node}</ThemeProvider>
        </Provider>,
    );

const mockedCreateHd = createHdWallet as unknown as jest.Mock;
const mockedImportHd = importHdWallet as unknown as jest.Mock;
const mockedImportPk = importPrivateKeyWallet as unknown as jest.Mock;

const fillConfirmWords = (words: string[]) => {
    for (let index = 0; index < words.length; index += 1) {
        fireEvent.change(screen.getByLabelText(`Word ${index + 1}`), {
            target: { value: words[index] },
        });
    }
};

describe("PasswordSetup", () => {
    it("shows mismatch beside confirm and does not write secrets to storage", async () => {
        const onPasswordSet = jest.fn();
        const user = userEvent.setup();

        renderWithProviders(<PasswordSetup onPasswordSet={onPasswordSet} />);

        await user.type(screen.getByLabelText("Password"), "ValidPass1!");
        await user.type(
            screen.getByLabelText("Confirm Password"),
            "ValidPass2!",
        );
        await user.click(screen.getByRole("button", { name: "Continue" }));

        expect(onPasswordSet).not.toHaveBeenCalled();
        expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
        expect(window.localStorage.setItem).not.toHaveBeenCalled();
    });
});

describe("CreateHdWalletForm", () => {
    it("supports 12 and 24 words then continues to password after saving phrase", async () => {
        const user = userEvent.setup();
        renderWithProviders(<CreateHdWalletForm customAccountName="Main" />);

        await waitFor(() => {
            expect(
                screen.getByText("alpha", { hidden: true }),
            ).toBeInTheDocument();
        });
        expect(screen.getByText("1.", { hidden: true })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "24 words" }));
        await waitFor(() => {
            expect(
                screen.getByText("24.", { hidden: true }),
            ).toBeInTheDocument();
        });
        await user.click(screen.getByRole("button", { name: "12 words" }));

        await user.click(
            screen.getByRole("button", { name: "Show recovery phrase" }),
        );
        await user.click(
            screen.getByRole("button", { name: "I've Saved My Phrase" }),
        );

        expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    it("guards double submit on create", async () => {
        let resolveCreate: (value: unknown) => void = () => undefined;
        const dispatch = jest.fn().mockReturnValue({
            unwrap: () =>
                new Promise((resolve) => {
                    resolveCreate = resolve;
                }),
        });

        const user = userEvent.setup();
        renderWithProviders(
            <CreateHdWalletForm customAccountName="Main" />,
            dispatch,
        );

        await waitFor(() => {
            expect(
                screen.getByText("alpha", { hidden: true }),
            ).toBeInTheDocument();
        });
        await user.click(
            screen.getByRole("button", { name: "Show recovery phrase" }),
        );
        await user.click(
            screen.getByRole("button", { name: "I've Saved My Phrase" }),
        );

        await user.type(screen.getByLabelText("Password"), "ValidPass1!");
        await user.type(
            screen.getByLabelText("Confirm Password"),
            "ValidPass1!",
        );

        const submit = screen.getByRole("button", { name: "Continue" });
        await user.click(submit);

        expect(mockedCreateHd).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(submit).toBeDisabled();
        resolveCreate({});
    });
});

describe("CreatePkWalletForm", () => {
    it("reveals generated key then creates via existing SDK thunk", async () => {
        const dispatch = jest.fn().mockReturnValue({
            unwrap: () => Promise.resolve({}),
        });
        const user = userEvent.setup();
        const onSuccess = jest.fn();

        renderWithProviders(
            <CreatePkWalletForm
                customAccountName="PK Main"
                onSuccess={onSuccess}
            />,
            dispatch,
        );

        expect(
            screen.getByText(/IMPORTANT: Save Your Private Key/i),
        ).toBeInTheDocument();
        await user.click(
            screen.getByRole("button", { name: "Show private key" }),
        );
        expect(screen.getByText("ab".repeat(32))).toBeInTheDocument();
        await user.click(
            screen.getByRole("button", { name: "I've Saved My Private Key" }),
        );

        await user.type(screen.getByLabelText("Password"), "ValidPass1!");
        await user.type(
            screen.getByLabelText("Confirm Password"),
            "ValidPass1!",
        );
        await user.click(screen.getByRole("button", { name: "Continue" }));

        await waitFor(() => expect(mockedImportPk).toHaveBeenCalledTimes(1));
        expect(mockedImportPk.mock.calls[0][0]).toEqual({
            name: "PK Main",
            privateKeyHex: "ab".repeat(32),
            password: "ValidPass1!",
        });
        await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    });
});

describe("Import forms", () => {
    beforeEach(() => {
        jest.spyOn(SdkWalletService, "isMnemonicValid").mockReturnValue(true);
        jest.spyOn(SdkWalletService, "isPrivateKeyHexValid").mockReturnValue(
            true,
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("imports mnemonic after password step using SDK thunk", async () => {
        const dispatch = jest.fn().mockReturnValue({
            unwrap: () => Promise.resolve({}),
        });
        const user = userEvent.setup();

        renderWithProviders(
            <ImportHdWalletForm customAccountName="Imported" />,
            dispatch,
        );

        fillConfirmWords(WORDS_12);
        await user.click(screen.getByRole("button", { name: "Import Wallet" }));
        await user.type(screen.getByLabelText("Password"), "ValidPass1!");
        await user.type(
            screen.getByLabelText("Confirm Password"),
            "ValidPass1!",
        );
        await user.click(screen.getByRole("button", { name: "Continue" }));

        await waitFor(() => expect(mockedImportHd).toHaveBeenCalledTimes(1));
    });

    it("imports private key after password step", async () => {
        const dispatch = jest.fn().mockReturnValue({
            unwrap: () => Promise.resolve({}),
        });
        const user = userEvent.setup();

        renderWithProviders(
            <ImportPkWalletForm customAccountName="Imported PK" />,
            dispatch,
        );

        await user.type(screen.getByLabelText("Private Key"), "cd".repeat(32));
        await user.click(
            screen.getByRole("button", { name: "Import Private Key" }),
        );
        await user.type(screen.getByLabelText("Password"), "ValidPass1!");
        await user.type(
            screen.getByLabelText("Confirm Password"),
            "ValidPass1!",
        );
        await user.click(screen.getByRole("button", { name: "Continue" }));

        await waitFor(() => expect(mockedImportPk).toHaveBeenCalledTimes(1));
    });

    it("separates keyfile password errors from file errors", async () => {
        jest.spyOn(
            SdkWalletService,
            "previewWalletKeyfileImport",
        ).mockRejectedValue({
            code: CustomErrorCode.INVALID_KEYFILE_PASSWORD,
            message: "Keyfile cannot be decrypted with the provided password",
        });

        const user = userEvent.setup();
        renderWithProviders(<ImportKeyfileWalletForm />);

        const file = new File(
            [JSON.stringify({ walletType: "hd", version: 1 })],
            "wallet.json",
            { type: "application/json" },
        );
        Object.defineProperty(file, "text", {
            value: async () => JSON.stringify({ walletType: "hd", version: 1 }),
        });
        await user.upload(screen.getByLabelText("Keyfile"), file);

        expect(
            await screen.findByText(/Loaded: wallet.json/i),
        ).toBeInTheDocument();

        await user.type(
            screen.getByPlaceholderText("Enter keyfile password"),
            "wrong",
        );
        await user.click(screen.getByRole("button", { name: "Continue" }));

        await waitFor(() => {
            expect(
                screen.getByText(
                    "Keyfile cannot be decrypted with the provided password",
                ),
            ).toBeInTheDocument();
        });
        expect(
            screen.queryByText("Selected file is not an ASI wallet keyfile."),
        ).not.toBeInTheDocument();
    });

    it("reports corrupted keyfile on the file field", async () => {
        const user = userEvent.setup();
        renderWithProviders(<ImportKeyfileWalletForm />);

        const file = new File(["not-json"], "broken.json", {
            type: "application/json",
        });
        Object.defineProperty(file, "text", {
            value: async () => "not-json",
        });
        await user.upload(screen.getByLabelText("Keyfile"), file);

        await waitFor(() => {
            expect(
                screen.getByText("Selected file is not an ASI wallet keyfile."),
            ).toBeInTheDocument();
        });
    });
});

describe("Modal secret cleanup", () => {
    it("unmounts form content when closed so visible secrets disappear", async () => {
        const user = userEvent.setup();
        const Harness = () => {
            const [open, setOpen] = React.useState(true);
            return (
                <>
                    <button type="button" onClick={() => setOpen(false)}>
                        Close harness
                    </button>
                    <ModalWindow
                        isOpen={open}
                        onClose={() => setOpen(false)}
                        title="Create Wallet"
                        dismissible={false}
                    >
                        <CreateHdWalletForm customAccountName="Temp" />
                    </ModalWindow>
                </>
            );
        };

        renderWithProviders(<Harness />);
        await waitFor(() => {
            expect(
                screen.getByText("alpha", { hidden: true }),
            ).toBeInTheDocument();
        });
        await user.click(
            screen.getByRole("button", { name: "Show recovery phrase" }),
        );
        expect(screen.getByText("alpha")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Close harness" }));
        expect(screen.queryByText("alpha")).not.toBeInTheDocument();
    });
});
