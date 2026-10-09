import { RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";

export type TDropdownDirection = "top" | "bottom" | "auto";

export interface IDropdownPosition {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    width: number;
    maxHeight?: number;
}

interface IUseDropdownPositionOptions {
    anchorRef: RefObject<HTMLElement>;
    floatingRef: RefObject<HTMLElement>;
    isOpen: boolean;
    direction?: TDropdownDirection;
    getWidth?: () => number;
    maxHeight?: number;
}

type TUseDropdownPosition =
    | { position: IDropdownPosition; isDropdownVisible: true }
    | { position: null; isDropdownVisible: false };

const ANCHOR_OFFSET_PX = 4;
const VIEWPORT_MARGIN_PX = 8;
const ALIGN_RIGHT_THRESHOLD_PX = 16;

const isSamePosition = (
    previous: IDropdownPosition | null,
    next: IDropdownPosition,
): boolean =>
    previous !== null &&
    previous.top === next.top &&
    previous.bottom === next.bottom &&
    previous.left === next.left &&
    previous.right === next.right &&
    previous.width === next.width &&
    previous.maxHeight === next.maxHeight;

const getHorizontalPosition = (
    anchorRect: DOMRect,
    getWidth?: () => number,
): Pick<IDropdownPosition, "left" | "right" | "width"> => {
    if (!getWidth) {
        return { left: anchorRect.left, width: anchorRect.width };
    }

    const width = getWidth();
    const alignRight =
        window.innerWidth - anchorRect.left < width + ALIGN_RIGHT_THRESHOLD_PX;

    return alignRight
        ? {
              right: Math.max(
                  VIEWPORT_MARGIN_PX,
                  window.innerWidth - anchorRect.right,
              ),
              width,
          }
        : { left: Math.max(VIEWPORT_MARGIN_PX, anchorRect.left), width };
};

const getVerticalPosition = (
    anchorRect: DOMRect,
    floating: HTMLElement | null,
    direction: TDropdownDirection,
    maxHeight?: number,
): Pick<IDropdownPosition, "top" | "bottom" | "maxHeight"> => {
    const spaceBelow =
        window.innerHeight -
        anchorRect.bottom -
        ANCHOR_OFFSET_PX -
        VIEWPORT_MARGIN_PX;
    const spaceAbove = anchorRect.top - ANCHOR_OFFSET_PX - VIEWPORT_MARGIN_PX;
    const floatingHeight = Math.min(
        floating?.scrollHeight ?? 0,
        maxHeight ?? Infinity,
    );
    const openUp =
        direction === "top" ||
        (direction === "auto" &&
            floatingHeight > spaceBelow &&
            spaceAbove > spaceBelow);
    const availableHeight = openUp ? spaceAbove : spaceBelow;

    return {
        ...(openUp
            ? {
                  bottom:
                      window.innerHeight - anchorRect.top + ANCHOR_OFFSET_PX,
              }
            : { top: anchorRect.bottom + ANCHOR_OFFSET_PX }),
        maxHeight:
            maxHeight === undefined
                ? undefined
                : Math.max(0, Math.min(maxHeight, availableHeight)),
    };
};

export const useDropdownPosition = ({
    anchorRef,
    floatingRef,
    isOpen,
    direction = "bottom",
    getWidth,
    maxHeight,
}: IUseDropdownPositionOptions): TUseDropdownPosition => {
    const [position, setPosition] = useState<IDropdownPosition | null>(null);
    const syncPositionRef = useRef<() => void>(() => undefined);
    const isDropdownVisible = position !== null;

    useLayoutEffect(() => {
        syncPositionRef.current = () => {
            const anchor = anchorRef.current;

            if (!anchor) {
                return;
            }

            const anchorRect = anchor.getBoundingClientRect();
            const nextPosition: IDropdownPosition = {
                ...getHorizontalPosition(anchorRect, getWidth),
                ...getVerticalPosition(
                    anchorRect,
                    floatingRef.current,
                    direction,
                    maxHeight,
                ),
            };

            setPosition((previous) =>
                isSamePosition(previous, nextPosition)
                    ? previous
                    : nextPosition,
            );
        };
    });

    useLayoutEffect(() => {
        if (isOpen) {
            syncPositionRef.current();
        } else {
            setPosition(null);
        }
    }, [isOpen, isDropdownVisible, direction, maxHeight]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleViewportChange = (): void => syncPositionRef.current();

        window.addEventListener("resize", handleViewportChange);
        window.addEventListener("scroll", handleViewportChange, true);

        return () => {
            window.removeEventListener("resize", handleViewportChange);
            window.removeEventListener("scroll", handleViewportChange, true);
        };
    }, [isOpen]);

    return position === null
        ? { position, isDropdownVisible: false }
        : { position, isDropdownVisible: true };
};
