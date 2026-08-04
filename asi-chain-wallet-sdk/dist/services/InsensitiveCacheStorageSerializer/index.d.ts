import Account from "@domains/Account";
import { IInsensitiveCacheRecord } from "@domains/InsensitiveCacheStorageRepository";
export default class InsensitiveCacheStorageSerializer {
    static serialize: (account: Account) => IInsensitiveCacheRecord;
}
