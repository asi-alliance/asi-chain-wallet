import BaseHttpClient from "@domains/BaseHttpClient";
export default class ValidatorClient extends BaseHttpClient {
    submitDeploy(deploy: any): Promise<unknown>;
    submitExploratoryDeploy(rholangCode: string): Promise<any>;
    getStatus(): Promise<unknown>;
}
