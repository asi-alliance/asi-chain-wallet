export default class BinaryWriterService {
    private buffer;
    writeString(fieldNumber: number, value: string): void;
    writeInt64(fieldNumber: number, value: number): void;
    private writeInteger;
    private writeInteger64;
    getResultBuffer(): Uint8Array;
}
