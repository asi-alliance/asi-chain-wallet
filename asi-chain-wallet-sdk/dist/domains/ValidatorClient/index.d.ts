import BaseHttpClient from "@domains/BaseHttpClient";
export default class ValidatorClient extends BaseHttpClient {
    submitDeploy(deploy: any): Promise<unknown>;
    submitExploratoryDeploy(body: unknown): Promise<any>;
    getStatus(): Promise<unknown>;
}
