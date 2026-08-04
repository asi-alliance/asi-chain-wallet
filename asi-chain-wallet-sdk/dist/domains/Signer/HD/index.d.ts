import Signer, { ISignedMessageResponse, THDSigningContext } from "@domains/Signer";
export default class HDSigner extends Signer {
    sign(payload: string, signingContext: THDSigningContext): Promise<ISignedMessageResponse>;
}
