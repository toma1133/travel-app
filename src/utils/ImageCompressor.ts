export interface CompressionOptions {
    maxDimension?: number; // 最大寬或高 (預設 1024px)
    quality?: number;      // 0.1 ~ 1.0 (預設 0.75)
    preferredMimeType?: "image/webp" | "image/jpeg";
}

export interface CompressionResult {
    blob: Blob;
    width: number;
    height: number;
    originalSizeBytes: number;
    compressedSizeBytes: number;
    compressionRatio: number; // 壓縮後大小 / 原始大小 (例如 0.15 代表縮小了 85%)
    mimeType: string;
}

/**
 * 純前端 Canvas 智慧等比壓縮工具
 * 將手機 4MB~10MB 拍照原圖壓縮至 ~80KB-120KB，大幅節省 90% 以上儲存空間
 */
export async function compressImage(
    fileOrBlob: File | Blob,
    options: CompressionOptions = {}
): Promise<CompressionResult> {
    const {
        maxDimension = 1024,
        quality = 0.75,
        preferredMimeType = "image/webp",
    } = options;

    const originalSizeBytes = fileOrBlob.size;

    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(fileOrBlob);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            let { width, height } = img;

            // 計算等比縮放尺寸
            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                } else {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("無法取得 Canvas 2D 繪圖上下文"));
                return;
            }

            // 針對 JPEG/WebP 平滑縮放
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, width, height);

            // 優先嘗試 WebP，不支援或失敗時降轉為 JPEG
            const attemptExport = (targetMime: string) => {
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            if (targetMime === "image/webp") {
                                // 嘗試降轉 JPEG
                                attemptExport("image/jpeg");
                                return;
                            }
                            reject(new Error("Canvas 導出圖片 Blob 失敗"));
                            return;
                        }

                        const compressedSizeBytes = blob.size;
                        const compressionRatio =
                            originalSizeBytes > 0
                                ? compressedSizeBytes / originalSizeBytes
                                : 1;

                        resolve({
                            blob,
                            width,
                            height,
                            originalSizeBytes,
                            compressedSizeBytes,
                            compressionRatio,
                            mimeType: blob.type || targetMime,
                        });
                    },
                    targetMime,
                    quality
                );
            };

            attemptExport(preferredMimeType);
        };

        img.onerror = (err) => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error(`圖片載入失敗: ${err}`));
        };

        img.src = objectUrl;
    });
}

/**
 * 格式化位元組為易讀的 KB / MB 字串
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
