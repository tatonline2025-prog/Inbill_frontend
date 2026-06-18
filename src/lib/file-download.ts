type SavePickerAcceptType = {
  description?: string;
  accept: Record<string, string[]>;
};

type SavePickerOptions = {
  id?: string;
  suggestedName?: string;
  types?: SavePickerAcceptType[];
};

type WritableFileStreamLike = {
  write: (data: Blob) => Promise<void>;
  close: () => Promise<void>;
};

type FileSystemFileHandleLike = {
  createWritable: () => Promise<WritableFileStreamLike>;
};

type WindowWithSaveFilePicker = Window & {
  showSaveFilePicker?: (options?: SavePickerOptions) => Promise<FileSystemFileHandleLike>;
};

export type PreparedFileSaveTarget = {
  mode: "picker" | "download";
  save: (blob: Blob, actualFileName?: string) => Promise<void>;
};

const EXCEL_SAVE_PICKER_ID = "inbill-excel-export";
const EXCEL_SAVE_MODE_PROMPT = [
  "Chon cach xuat Excel:",
  "",
  "OK = Luu truc tiep vao thu muc ban chon (co nho vi tri cu).",
  "Cancel = Tai qua trinh duyet de thay file vua tai nhu truoc.",
].join("\n");

const EXCEL_SAVE_PICKER_TYPES: SavePickerAcceptType[] = [
  {
    description: "Excel Files",
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
  },
];

const triggerBrowserDownload = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

const isAbortLikeError = (error: unknown) => {
  return !!error && typeof error === "object" && "name" in error && error.name === "AbortError";
};

const createBrowserDownloadTarget = (suggestedFileName: string): PreparedFileSaveTarget => ({
  mode: "download",
  save: async (blob, actualFileName) => {
    triggerBrowserDownload(blob, actualFileName || suggestedFileName);
  },
});

const chooseExcelSaveMode = (): PreparedFileSaveTarget["mode"] => {
  const useDirectSave = window.confirm(EXCEL_SAVE_MODE_PROMPT);
  return useDirectSave ? "picker" : "download";
};

export const resolveContentDispositionFileName = (contentDisposition: string | null, fallbackFileName: string) => {
  if (!contentDisposition) return fallbackFileName;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const normalMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  return normalMatch?.[1] || fallbackFileName;
};

export const prepareExcelSaveTarget = async (
  suggestedFileName: string
): Promise<PreparedFileSaveTarget | null> => {
  const browserWindow = window as WindowWithSaveFilePicker;

  if (typeof browserWindow.showSaveFilePicker !== "function" || !window.isSecureContext) {
    return createBrowserDownloadTarget(suggestedFileName);
  }

  const saveMode = chooseExcelSaveMode();
  if (saveMode === "download") {
    return createBrowserDownloadTarget(suggestedFileName);
  }

  try {
    const fileHandle = await browserWindow.showSaveFilePicker({
      id: EXCEL_SAVE_PICKER_ID,
      suggestedName: suggestedFileName,
      types: EXCEL_SAVE_PICKER_TYPES,
    });

    return {
      mode: "picker",
      save: async (blob) => {
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      },
    };
  } catch (error) {
    if (isAbortLikeError(error)) {
      return null;
    }

    console.warn("showSaveFilePicker failed, fallback to browser download.", error);

    return createBrowserDownloadTarget(suggestedFileName);
  }
};
