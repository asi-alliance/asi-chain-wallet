import {
    AdaptiveSelect,
    ISelectOption,
    ISelectProps,
} from "components/Select/Select";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSdkClient } from "sdk/SdkClientProvider";

import { AppDispatch, RootState } from "store";
import {
    selectNetwork,
    selectSelectedAccountId,
    selectAccountById,
} from "store/WalletsStore";

type NetworkSelectorProps = Omit<
    ISelectProps,
    "value" | "onChange" | "options"
>;

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
    disabled = false,
    ...props
}) => {
    const dispatch = useDispatch<AppDispatch>();

    const networks = useSelector(
        (state: RootState) => state.walletsStore.networks,
    );

    const selectedNetwork = useSelector(
        (state: RootState) => state.walletsStore.selectedNetwork,
    );

    const selectedAccountId = useSelector(selectSelectedAccountId);

    const selectedAccount = useSelector((state: RootState) =>
        selectedAccountId ? selectAccountById(state, selectedAccountId) : null,
    );

    const isAuthenticated = useSelector(
        (state: RootState) => state.auth.isAuthenticated,
    );

    const { isNetworkBusy } = useSdkClient();

    const cacheNetworkByAddress = useCallback(
        (networkId: string): void => {
            if (!isAuthenticated || !selectedAccount?.address) {
                return;
            }

            const raw = localStorage.getItem("NETWORKS_BY_ADDRESS");

            const networkByAddressMap: Record<string, string> = raw
                ? JSON.parse(raw)
                : {};

            networkByAddressMap[selectedAccount.address] = networkId;

            localStorage.setItem(
                "NETWORKS_BY_ADDRESS",
                JSON.stringify(networkByAddressMap),
            );
        },
        [isAuthenticated, selectedAccount?.address],
    );

    const handleNetworkChange = useCallback(
        (networkId: string): void => {
            if (isNetworkBusy) {
                return;
            }

            dispatch(selectNetwork(networkId));
            cacheNetworkByAddress(networkId);
        },
        [dispatch, isNetworkBusy, cacheNetworkByAddress],
    );

    const options: ISelectOption[] = networks.map((network) => ({
        id: network.id,
        value: network.id,
        label: network.name,
    }));

    if (!selectedNetwork) {
        return null;
    }

    return (
        <AdaptiveSelect
            {...props}
            id="header-network-selector"
            value={selectedNetwork.id}
            onChange={handleNetworkChange}
            disabled={disabled || isNetworkBusy}
            options={options}
            variant="ghost"
        />
    );
};
