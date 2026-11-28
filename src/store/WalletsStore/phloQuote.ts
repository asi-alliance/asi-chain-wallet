export interface IPhloQuote {
    phloLimit: number;
    phloPrice: string;
    gasReserve: string;
}

export interface IPhloQuoteQueryArgs {
    networkId: string;
    validatorUrl: string;
    preferredLimit?: number;
}

export const PHLO_QUOTE_POLLING_INTERVAL_MS = 60_000;

export const isPhloQuoteNetworkActive = (
    activeNetwork: { id: string; validatorUrl: string },
    {
        networkId,
        validatorUrl,
    }: Pick<IPhloQuoteQueryArgs, "networkId" | "validatorUrl">,
): boolean =>
    activeNetwork.id === networkId &&
    activeNetwork.validatorUrl === validatorUrl;
