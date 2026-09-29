import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { AccountSwitcher } from "components/AccountSwitcher";
import { lightTheme } from "styles/theme";

jest.mock("components/AccountBalanceValue", () => ({
    AccountBalanceValue: () => null,
}));

const accounts = [
    { id: "account-1", name: "Main", address: "1111111111111111" },
    { id: "account-2", name: "Second", address: "2222222222222222" },
];

it("closes and disables an already-open account menu when locked", () => {
    const onSelect = jest.fn();
    const renderSwitcher = (disabled: boolean) => (
        <ThemeProvider theme={lightTheme}>
            <AccountSwitcher
                accounts={accounts}
                selectedId="account-1"
                onSelect={onSelect}
                disabled={disabled}
            />
        </ThemeProvider>
    );
    const view = render(renderSwitcher(false));

    fireEvent.click(screen.getByRole("button", { name: /Main/i }));
    const secondAccount = screen.getByRole("button", { name: /Second/i });

    view.rerender(renderSwitcher(true));

    expect(screen.getByRole("button", { name: /Main/i })).toBeDisabled();
    expect(
        screen.queryByRole("button", { name: /Second/i }),
    ).not.toBeInTheDocument();
    fireEvent.click(secondAccount);
    expect(onSelect).not.toHaveBeenCalled();
});
