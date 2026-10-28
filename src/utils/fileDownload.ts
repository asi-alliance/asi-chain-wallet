import { ExportFormat } from "@asichain/asi-wallet-sdk";

export const EXPORT_FORMAT_MIME: Record<ExportFormat, string> = {
    [ExportFormat.JSON]: "application/json",
    [ExportFormat.CSV]: "text/csv",
};

export const downloadTextFile = (
    fileName: string,
    content: string,
    mimeType: string,
): void => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = fileName;

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
};

export const downloadExport = (
    baseName: string,
    content: string,
    format: ExportFormat,
): void =>
    downloadTextFile(
        `${baseName}.${format}`,
        content,
        EXPORT_FORMAT_MIME[format],
    );