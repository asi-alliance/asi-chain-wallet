import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { PropsWithChildren } from "react";
import { RootState } from "store";

export const ExistingAccountGuard = ({
    children,
}: PropsWithChildren): JSX.Element => {
    const { isAuthenticated, hasAccounts } = useSelector(
        (state: RootState) => state.auth,
    );

    if (hasAccounts && !isAuthenticated) {
        return <Navigate to={"/login"} />;
    }

    return <>{children}</>;
};
