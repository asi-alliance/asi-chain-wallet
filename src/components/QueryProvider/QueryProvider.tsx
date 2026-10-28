import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, ReactElement } from "react";

const queryClient = new QueryClient();

export const QueryProvider = ({
    children,
}: PropsWithChildren): ReactElement => {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};
