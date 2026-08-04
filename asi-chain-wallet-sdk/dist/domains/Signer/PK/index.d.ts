import Signer, { ISignedMessageResponse, TSigningContext } from "@domains/Signer";
export default class PrivateKeySigner extends Signer {
    sign(payload: string, signingContext: TSigningContext): Promise<ISignedMessageResponse>;
}
