export declare class ModifiedDataView extends DataView<ArrayBufferLike> {
    getInt24(byteOffset: number, littleEndian?: boolean): number;
    getUint24(byteOffset: number, littleEndian?: boolean): number;
    setInt24(byteOffset: number, value: number, littleEndian?: boolean): void;
    setUint24(byteOffset: number, value: number, littleEndian?: boolean): void;
    private getByte;
    private setByte;
}
