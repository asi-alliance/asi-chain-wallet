import { useEffect, useRef } from "react";

export interface IDisposableAsyncHandlers<T> {
    onResolve: (value: T) => void;
    onDispose: (value: T) => void;
    onError?: (error: unknown, disposed: boolean) => void;
}

export const useDisposableAsync = <T>(
    factory: () => Promise<T>,
    handlers: IDisposableAsyncHandlers<T>,
): void => {
    const factoryRef = useRef<() => Promise<T>>(factory);
    const handlersRef = useRef<IDisposableAsyncHandlers<T>>(handlers);

    useEffect(() => {
        factoryRef.current = factory;
        handlersRef.current = handlers;
    });

    useEffect(() => {
        let disposed = false;

        factoryRef
            .current()
            .then((value) => {
                if (disposed) {
                    handlersRef.current.onDispose(value);

                    return;
                }

                handlersRef.current.onResolve(value);
            })
            .catch((error: unknown) => {
                handlersRef.current.onError?.(error, disposed);
            });

        return () => {
            disposed = true;
        };
    }, []);
};
