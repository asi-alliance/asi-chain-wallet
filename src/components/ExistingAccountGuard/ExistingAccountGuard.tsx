import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { PropsWithChildren } from "react";
import { RootState } from "store";
import { selectHasWallets } from "store/WalletsStore";

export const ExistingAccountGuard = ({
    children,
}: PropsWithChildren): JSX.Element => {
    const isAuthenticated = useSelector(
        (state: RootState) => state.auth.isAuthenticated,
    );
    const hasWallets = useSelector(selectHasWallets);

    if (hasWallets && !isAuthenticated) {
        return <Navigate to={"/login"} />;
    }

    return <>{children}</>;
};
