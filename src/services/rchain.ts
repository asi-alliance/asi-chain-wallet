import axios, { AxiosInstance } from "axios";
import { SignedResult } from "@asichain/asi-wallet-sdk";

export const BRIDGE_LOCK_PHLO_LIMIT: number = 5_000_000_000;
export const BRIDGE_LOCK_PHLO_PRICE: number = 1;
export const BRIDGE_LOCK_MAX_GAS_COST: bigint =
    BigInt(BRIDGE_LOCK_PHLO_LIMIT) * BigInt(BRIDGE_LOCK_PHLO_PRICE);

export class RChainService {
    private validatorClient: AxiosInstance;
    private nodeUrl: string;

    constructor(nodeUrl: string, graphqlUrl?: string) {
        if (!nodeUrl || !nodeUrl.trim()) {
            if (!graphqlUrl || !graphqlUrl.trim()) {
                throw new Error(
                    "RChainService: either nodeUrl (validator URL) or graphqlUrl must be provided",
                );
            }
            this.nodeUrl = "";
        } else {
            this.nodeUrl = nodeUrl.trim();
        }

        this.validatorClient = axios.create({
            baseURL: this.nodeUrl || "http://localhost",
            timeout: 30000,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    // Lock tokens on the ASI bridge for cross-chain transfer.
    // fromAddr is derived on-chain from the signed deploy's deployer.
    buildBridgeLockTerm(
        amountBaseUnits: string,
        recipient: string,
        destChainId: number,
        bridgeUri: string,
    ): string {
        return `
      new deployId(\`rho:system:deployId\`),
          deployerId(\`rho:system:deployerId\`),
          rl(\`rho:registry:lookup\`),
          VaultAddress(\`rho:vault:address\`),
          SystemVaultCh, bridgeCh, fromAddrCh, fromAuthKeyCh, ret in {
        rl!(\`rho:vault:system\`, *SystemVaultCh) |
        rl!(\`${bridgeUri}\`, *bridgeCh) |
        for (@(_, SystemVault) <- SystemVaultCh; bridge <- bridgeCh) {
          VaultAddress!("fromDeployerId", *deployerId, *fromAddrCh) |
          @SystemVault!("deployerAuthKey", *deployerId, *fromAuthKeyCh) |
          for (@fromAddr <- fromAddrCh; fromAuthKey <- fromAuthKeyCh) {
            bridge!("lock", (fromAddr, ${amountBaseUnits}, "${recipient}", ${destChainId}), *fromAuthKey, *ret) |
            for (@result <- ret) { deployId!(result) }
          }
        }
      }
    `;
    }

    async submitDeploy(signedDeploy: SignedResult): Promise<void> {
        try {
            let result;
            try {
                result = await this.postDeploy(signedDeploy);
            } catch (error: any) {
                console.error("Deploy failed to send:", error);

                // Check if it's a network/server error (deploy didn't reach server)
                if (
                    error.code === "ERR_NETWORK" ||
                    error.code === "ECONNREFUSED" ||
                    error.code === "ETIMEDOUT" ||
                    error.code === "ENOTFOUND" ||
                    error.message.includes("Network Error") ||
                    error.message.includes("timeout")
                ) {
                    throw new Error(
                        `Deploy failed: Server is unreachable. The deploy was NOT sent to the network. Please check your connection and try again.`,
                    );
                }

                // For other errors, rethrow with original message
                throw new Error(`Deploy failed: ${error.message}`);
            }

            // The deploy result should contain a signature which is the deploy ID
            // The Web API returns the signature string, sometimes with a prefix
            const acknowledgedDeployId =
                typeof result === "string"
                    ? result
                    : result?.signature || result?.deployId || result;

            // Validate that the node acknowledged the deploy
            if (
                !acknowledgedDeployId ||
                (typeof acknowledgedDeployId === "string" &&
                    acknowledgedDeployId.trim().length === 0)
            ) {
                throw new Error(
                    "Deploy failed: Server did not return a valid deploy ID. The deploy may not have been sent.",
                );
            }
        } catch (error: any) {
            console.error("Deploy failed:", error);
            // Re-throw the error (it's already formatted above)
            throw error;
        }
    }

    private async postDeploy(signedDeploy: SignedResult): Promise<any> {
        try {
            const response = await this.validatorClient.post(
                "/api/deploy",
                signedDeploy,
            );
            return response.data;
        } catch (error: any) {
            if (error.response) {
                throw new Error(
                    `RNode API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
                );
            } else if (error.request) {
                throw new Error(
                    `Network Error: Unable to connect to Validator Node at ${this.nodeUrl}`,
                );
            } else {
                throw new Error(`Request Error: ${error.message}`);
            }
        }
    }
}
