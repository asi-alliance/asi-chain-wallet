import { Navigate, useSearchParams } from "react-router-dom";
import { AccountActions } from "types/wallet";
import { useSelector } from "react-redux";
import { PropsWithChildren } from "react";
import { RootState } from "store";

export const ExistingAccountGuard = ({
    children,
}: PropsWithChildren): JSX.Element => {
    const isAuthenticated = useSelector(
        (state: RootState) => state.auth.isAuthenticated,
    );
    const hasAccounts = useSelector(
        (state: RootState) => state.auth.hasAccounts,
    );
    const [searchParams] = useSearchParams();

    const isCreatingAccount: boolean =
        searchParams.get("action") === AccountActions.CREATE;

    if (hasAccounts && !isAuthenticated && !isCreatingAccount) {
        return <Navigate to={"/login"} />;
    }

    return <>{children}</>;
};
