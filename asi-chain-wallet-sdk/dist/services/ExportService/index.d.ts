import { ExportFormat } from "@config/index";
import { Transaction } from "@domains/Transaction";
import { EncryptedData } from "@services/Crypto";
export interface IAccountKeyfileInput {
    address: string;
    encryptedPrivateKey: EncryptedData;
}
export default class ExportService {
    static exportAccountKeyfile(input: IAccountKeyfileInput): string;
    static exportTransactions(transactions: Transaction[], format?: ExportFormat): string;
    private static escapeCsvValue;
}
