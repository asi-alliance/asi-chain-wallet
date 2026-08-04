import { AxiosInstance, AxiosRequestConfig } from "axios";
export type TAxiosClientConfig = {
    baseUrl: string;
    axiosConfig?: AxiosRequestConfig;
};
export default abstract class BaseHttpClient {
    protected readonly client: AxiosInstance;
    constructor(config: TAxiosClientConfig);
    protected get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    protected post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
}
