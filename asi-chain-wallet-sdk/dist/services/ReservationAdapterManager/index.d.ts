import ReservationAdapter from "@domains/ReservationAdapter";
import Wallet from "@domains/Wallet";
import DisposableItemManager from "@services/DisposableItemManager";
declare class ReservationAdapterManager extends DisposableItemManager<ReservationAdapter> {
    create(wallet: Wallet): Promise<ReservationAdapter>;
}
export default ReservationAdapterManager;
