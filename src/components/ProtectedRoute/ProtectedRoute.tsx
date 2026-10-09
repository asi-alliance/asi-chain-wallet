import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { RootState } from "store";
import { selectHasWallets } from "store/WalletsStore";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const isAuthenticated = useSelector(
        (state: RootState) => state.auth.isAuthenticated,
    );
    const hasWallets = useSelector(selectHasWallets);

    if (!hasWallets) {
        return <Navigate to="/accounts" replace />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
