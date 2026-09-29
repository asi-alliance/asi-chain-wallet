import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "styles/theme";
import { EditableLabel } from "components/EditableLabel/EditableLabel";

describe("EditableLabel", () => {
    it("does not cancel edit on blur while a save error is shown", async () => {
        const user = userEvent.setup();
        const onSave = jest.fn(async () => {
            throw new Error("Rename failed");
        });
        const onCancel = jest.fn();

        const { rerender } = render(
            <ThemeProvider theme={lightTheme}>
                <EditableLabel
                    label="Account 1"
                    onSave={onSave}
                    onCancel={onCancel}
                    aria-label="Account name"
                />
            </ThemeProvider>,
        );

        await user.click(screen.getByLabelText("Edit Account 1"));
        const input = screen.getByRole("textbox", { name: "Account name" });
        await user.clear(input);
        await user.type(input, "Account 2");
        await user.keyboard("{Enter}");

        await waitFor(() => expect(onSave).toHaveBeenCalled());

        rerender(
            <ThemeProvider theme={lightTheme}>
                <EditableLabel
                    label="Account 1"
                    onSave={onSave}
                    onCancel={onCancel}
                    errorMessage="Rename failed"
                    aria-label="Account name"
                />
            </ThemeProvider>,
        );

        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent("Rename failed");
        expect(input).toHaveAttribute("aria-invalid", "true");
        expect(input).toHaveAttribute(
            "aria-describedby",
            expect.stringContaining(alert.id),
        );

        fireEvent.blur(input);

        expect(onCancel).not.toHaveBeenCalled();
        expect(screen.getByRole("alert")).toHaveTextContent("Rename failed");
        expect(
            screen.getByRole("textbox", { name: "Account name" }),
        ).toBeTruthy();
    });

    it("does not steal focus back to the rename field after a save error", async () => {
        const user = userEvent.setup();

        render(
            <ThemeProvider theme={lightTheme}>
                <div>
                    <EditableLabel
                        label="Account 1"
                        onSave={jest.fn()}
                        errorMessage="Rename failed"
                        aria-label="Account name"
                    />
                    <button type="button">Other control</button>
                </div>
            </ThemeProvider>,
        );

        await user.click(screen.getByLabelText("Edit Account 1"));
        expect(
            screen.getByRole("textbox", { name: "Account name" }),
        ).toBeTruthy();

        await user.click(screen.getByRole("button", { name: "Other control" }));

        expect(
            screen.getByRole("button", { name: "Other control" }),
        ).toHaveFocus();
        expect(screen.getByRole("alert")).toHaveTextContent("Rename failed");
        expect(
            screen.getByRole("textbox", { name: "Account name" }),
        ).toBeTruthy();
    });

    it("stops name click from bubbling to a parent activator", async () => {
        const user = userEvent.setup();
        const onParentClick = jest.fn();

        render(
            <ThemeProvider theme={lightTheme}>
                <div onClick={onParentClick}>
                    <EditableLabel label="Account 1" onSave={jest.fn()} />
                </div>
            </ThemeProvider>,
        );

        await user.click(screen.getByText("Account 1"));
        expect(onParentClick).not.toHaveBeenCalled();
        expect(screen.getByRole("textbox")).toBeTruthy();
    });

    it("cancels on Escape even when an error is shown", async () => {
        const user = userEvent.setup();
        const onCancel = jest.fn();

        render(
            <ThemeProvider theme={lightTheme}>
                <EditableLabel
                    label="Account 1"
                    onSave={jest.fn()}
                    onCancel={onCancel}
                    errorMessage="Rename failed"
                />
            </ThemeProvider>,
        );

        await user.click(screen.getByLabelText("Edit Account 1"));
        await user.keyboard("{Escape}");

        expect(onCancel).toHaveBeenCalled();
        expect(screen.queryByRole("textbox")).toBeNull();
    });

    it("ignores a second Enter while a save is pending", async () => {
        const user = userEvent.setup();
        let resolveSave: () => void = () => undefined;
        const onSave = jest.fn(
            () =>
                new Promise<void>((resolve) => {
                    resolveSave = resolve;
                }),
        );

        render(
            <ThemeProvider theme={lightTheme}>
                <EditableLabel
                    label="Account 1"
                    onSave={onSave}
                    aria-label="Account name"
                />
            </ThemeProvider>,
        );

        await user.click(screen.getByLabelText("Edit Account 1"));
        const input = screen.getByRole("textbox", { name: "Account name" });
        await user.clear(input);
        await user.type(input, "Account 2");

        fireEvent.keyDown(input, { key: "Enter" });
        fireEvent.keyDown(input, { key: "Enter" });

        expect(onSave).toHaveBeenCalledTimes(1);

        resolveSave();
        await waitFor(() => {
            expect(screen.queryByRole("textbox")).toBeNull();
        });
    });

    it("names edit actions per label value", () => {
        render(
            <ThemeProvider theme={lightTheme}>
                <div>
                    <EditableLabel label="Account 0" onSave={jest.fn()} />
                    <EditableLabel label="Account 1" onSave={jest.fn()} />
                </div>
            </ThemeProvider>,
        );

        expect(screen.getByLabelText("Edit Account 0")).toBeTruthy();
        expect(screen.getByLabelText("Edit Account 1")).toBeTruthy();
    });
});
