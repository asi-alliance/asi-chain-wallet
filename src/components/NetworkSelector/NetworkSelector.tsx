import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { AdaptiveSelect, ISelectOption, ISelectProps } from "components/Select";
import { useIsNetworkBusy } from "sdk";
import { AppDispatch } from "store";
import { selectNetworks, selectSelectedNetwork } from "store/WalletsStore";
import { selectNetwork } from "store/WalletsStore/thunks";
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

    const isNetworkBusy = useIsNetworkBusy(selectedNetwork.id);

    const handleNetworkChange = (networkId: string): void => {
        dispatch(selectNetwork({ id: networkId }))
            .unwrap()
            .catch((error: string) => {
                console.error("Failed to select network:", error);
            });
    };

    const options: ISelectOption[] = networks.map((network: Network) => ({
        id: network.id,
        value: network.id,
        label: network.name,
    }));

    return (
        <AdaptiveSelect
            {...props}
            value={selectedNetwork.id}
            onChange={handleNetworkChange}
            disabled={disabled || isNetworkBusy}
            options={options}
            variant="ghost"
        />
    );
};
