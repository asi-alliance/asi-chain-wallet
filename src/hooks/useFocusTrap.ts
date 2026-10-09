import { RefObject, useEffect, useLayoutEffect, useRef } from "react";
import { getFocusableElements } from "utils/focus";

interface IUseFocusTrapOptions {
    active: boolean;
    initialFocusRef?: RefObject<HTMLElement>;
    onEscape?: () => void;
    isPaused?: () => boolean;
    isAllowedOutsideTarget?: (target: Node) => boolean;
    restoreFocus?: boolean;
}

const focusFirstElement = (container: HTMLElement): void => {
    (getFocusableElements(container)[0] ?? container).focus();
};

export const useFocusTrap = (
    containerRef: RefObject<HTMLElement>,
    options: IUseFocusTrapOptions,
): void => {
    const optionsRef = useRef<IUseFocusTrapOptions>(options);
    const { active } = options;

    useLayoutEffect(() => {
        optionsRef.current = options;
    });

    useEffect(() => {
        if (!active) {
            return;
        }

        const focusOrigin: HTMLElement | null = optionsRef.current.restoreFocus
            ? (document.activeElement as HTMLElement | null)
            : null;
        const isPaused = (): boolean => optionsRef.current.isPaused?.() ?? false;

        const focusTimer = window.setTimeout(() => {
            const container = containerRef.current;

            if (!container || isPaused()) {
                return;
            }

            const initialFocus = optionsRef.current.initialFocusRef?.current;

            if (initialFocus) {
                initialFocus.focus();
                return;
            }

            focusFirstElement(container);
        }, 0);

        const handleKeyDown = (event: KeyboardEvent): void => {
            const container = containerRef.current;

            if (!container || isPaused()) {
                return;
            }

            const { onEscape } = optionsRef.current;

            if (event.key === "Escape" && onEscape) {
                event.preventDefault();
                event.stopPropagation();
                onEscape();
                return;
            }

            if (event.key !== "Tab") {
                return;
            }

            const focusableElements = getFocusableElements(container);

            if (!focusableElements.length) {
                event.preventDefault();
                container.focus();
                return;
            }

            const first = focusableElements[0];
            const last = focusableElements[focusableElements.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        const handleFocusIn = (event: FocusEvent): void => {
            const container = containerRef.current;
            const target = event.target as Node;

            if (
                !container ||
                isPaused() ||
                container.contains(target) ||
                optionsRef.current.isAllowedOutsideTarget?.(target)
            ) {
                return;
            }

            focusFirstElement(container);
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("focusin", handleFocusIn);

        return () => {
            window.clearTimeout(focusTimer);
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("focusin", handleFocusIn);
            focusOrigin?.focus?.();
        };
    }, [active, containerRef]);
};
