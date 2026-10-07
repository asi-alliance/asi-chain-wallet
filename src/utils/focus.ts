const FOCUSABLE_ELEMENTS = [
    'a[href]:not([tabindex="-1"]):not([aria-hidden="true"]):not([hidden])',
    'button:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"]):not([hidden])',
    'textarea:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"]):not([hidden])',
    'input:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"]):not([hidden])',
    'select:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"]):not([hidden])',
    '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"]):not([hidden])',
].join(",");

export const isAvailableForFocus = (element: HTMLElement): boolean => {
    if (
        !element.isConnected ||
        element.matches(':disabled, input[type="hidden"]') ||
        element.closest('[hidden], [inert], [aria-hidden="true"]')
    ) {
        return false;
    }

    for (
        let ancestor: HTMLElement | null = element;
        ancestor;
        ancestor = ancestor.parentElement
    ) {
        const style = window.getComputedStyle(ancestor);

        if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.visibility === "collapse"
        ) {
            return false;
        }
    }

    return true;
};

export const getFocusableElements = (container: HTMLElement): HTMLElement[] =>
    Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS),
    ).filter(isAvailableForFocus);
