import React from "react";
import { render, screen, within } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { TransactionConfirmationModal } from "components/ConfirmationModal";
import { lightTheme } from "styles/theme";

it("does not show a fee-only total for a non-positive amount", () => {
    render(
        <ThemeProvider theme={lightTheme}>
            <TransactionConfirmationModal
                isOpen
                onClose={jest.fn()}
                onConfirm={jest.fn()}
                amount="0"
                recipient="recipient-address"
                senderAddress="sender-address"
                senderName="Main"
                maxFee={0.0025}
                feeLabel="~0.002-0.0025"
                totalLabel="Maximum total"
            />
        </ThemeProvider>,
    );

    const dialog = screen.getByRole("dialog", {
        name: "Confirm transaction",
    });
    expect(within(dialog).getByText(/— ASI/)).toBeInTheDocument();
    expect(
        within(dialog).queryByText(/0\.00250000 ASI/),
    ).not.toBeInTheDocument();
});
