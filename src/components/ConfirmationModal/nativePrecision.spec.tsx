import React from "react";
import { expect, jest, test } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "styled-components";
import { GasFee } from "@asichain/asi-wallet-sdk";
import { lightTheme } from "../../styles/theme";
import { TransactionConfirmationModal } from "./ConfirmationModal";
import { DeploymentConfirmationModal } from "../DeployConfirmationModal/DeployConfirmationModal";

jest.mock("components", () => {
    const React = require("react");
    return {
        Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => React.createElement("button", { onClick }, children),
        PasswordInput: () => null,
    };
});
jest.mock("hooks", () => ({ useScreen: () => ({ isLaptop: false }) }));
jest.mock("components/ModalWindow", () => {
    const React = require("react");
    return { ModalWindow: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) => isOpen ? React.createElement("div", null, children) : null };
});

test.each([
    [18, "10.000000000000000001", "10.000000000000250001"],
    [8, "1.50000001", "1.50250001"],
])("transfer confirmation renders the complete amount and fee total at %i decimals", (nativeTokenDecimals, amount, total) => {
    const view = renderToStaticMarkup(<ThemeProvider theme={lightTheme}>
        <TransactionConfirmationModal isOpen onClose={() => {}} onConfirm={() => {}}
            amount={amount} recipient="recipient" senderAddress="sender" senderName="Fixture"
            nativeTokenDecimals={nativeTokenDecimals} maxFee={GasFee.MAX} feeLabel="fee" />
    </ThemeProvider>);
    expect(view).toContain(amount);
    expect(view).toContain(total);
});

test.each([
    [18, "0.000000000001"],
    [8, "0.01"],
])("deploy confirmation renders token fee budget at %i decimals", (nativeTokenDecimals, fee) => {
    const view = renderToStaticMarkup(<ThemeProvider theme={lightTheme}>
        <DeploymentConfirmationModal isOpen onClose={() => {}} onConfirm={() => {}}
            rholangCode="Nil" phloLimit="1000000" phloPrice="1"
            nativeTokenDecimals={nativeTokenDecimals} accountName="Fixture" accountAddress="sender" />
    </ThemeProvider>);
    expect(view).toContain(`${fee} ASI`);
    expect(view).toContain("Maximum Fee");
});
