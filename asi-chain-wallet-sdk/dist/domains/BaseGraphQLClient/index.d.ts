import { TAxiosClientConfig } from "@domains/BaseHttpClient";
export default class BaseGraphQLClient {
    private readonly client;
    constructor(config: TAxiosClientConfig);
    query<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
}
