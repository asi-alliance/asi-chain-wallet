import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "store/hooks";
import { selectActiveWallet } from "store/WalletsStore";
import { logout } from "store/Auth/thunks";
import { IUseDeleteWallet, useDeleteWallet } from "./useDeleteWallet";

export const useDeleteActiveWallet = (): IUseDeleteWallet => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const activeWallet = useSelector(selectActiveWallet);

    return useDeleteWallet(activeWallet?.id, {
        onSuccess: async () => {
            await dispatch(logout()).unwrap();

            navigate("/login");
        },
    });
};