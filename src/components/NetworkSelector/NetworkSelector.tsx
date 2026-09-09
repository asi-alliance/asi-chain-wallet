import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AdaptiveSelect, ISelectOption, ISelectProps } from "components/Select";
import { useBusyNetworkIds } from "sdk";
import { AppDispatch } from "store";
import { selectNetworks, selectSelectedNetwork } from "store/WalletsStore";
import { selectNetwork } from "store/WalletsStore/thunks";
import { selectIsNetworkOperationPending } from "store/networkOperationSlice";
import { Network } from "types/wallet";

type NetworkSelectorProps = Omit<
    ISelectProps,
    "value" | "onChange" | "options"
>;

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
    disabled = false,
    ...props
}) => {
    const dispatch = useDispatch<AppDispatch>();

    const networks = useSelector(selectNetworks);
    const selectedNetwork = useSelector(selectSelectedNetwork);

    const busyNetworkIds = useBusyNetworkIds();
    const isNetworkOperationPending = useSelector(
        selectIsNetworkOperationPending,
    );

    const handleNetworkChange = (networkId: string): void => {
        dispatch(selectNetwork({ id: networkId }))
            .unwrap()
            .catch((error: string) => {
                console.error("Failed to select network:", error);
            });
    };

    const options: ISelectOption[] = useMemo(() => {
        const busyNetworkIdSet = new Set(busyNetworkIds);
        const isSelectedNetworkBusy = busyNetworkIdSet.has(
            selectedNetwork.id,
        );
        const isSwitchingBlocked =
            isNetworkOperationPending || isSelectedNetworkBusy;

        return networks.map((network: Network) => {
            const isBusy = busyNetworkIdSet.has(network.id);
            const isSelected = network.id === selectedNetwork.id;

            return {
                id: network.id,
                value: network.id,
                label: network.name,
                additionalLabel: isBusy ? "(busy)" : undefined,
                disabled:
                    !network.validatorUrl ||
                    (!isSelected && (isBusy || isSwitchingBlocked)),
            };
        });
    }, [
        busyNetworkIds,
        isNetworkOperationPending,
        networks,
        selectedNetwork.id,
    ]);

    return (
        <AdaptiveSelect
            {...props}
            value={selectedNetwork.id}
            onChange={handleNetworkChange}
            disabled={disabled}
            options={options}
            variant="ghost"
        />
    );
};
