import { Platform } from "react-native";

export type CompressResult = {
  uri: string;
  sizeMB: number;
  compressed: boolean;
  reason?: string;
};

const NEEDS_COMPRESSION_MB = 8;

async function measureMB(uri: string, fallback?: number): Promise<number> {
  if (fallback && fallback > 0) return fallback;
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return blob.size / (1024 * 1024);
  } catch {
    return 0;
  }
}

export async function compressVideoIfNeeded(
  uri: string,
  opts: { reportedSizeMB?: number; onProgress?: (pct: number) => void } = {},
): Promise<CompressResult> {
  // Web has no native transcoder. Browsers can't run AVAssetExportSession
  // or MediaCodec, and ffmpeg.wasm is too heavy for a social app upload.
  // Just return the original URI — the upload will proceed and the preview
  // fallback handles unsupported codecs gracefully.
  if (Platform.OS === "web") {
    const sizeMB = await measureMB(uri, opts.reportedSizeMB);
    return { uri, sizeMB, compressed: false, reason: "web-no-transcode" };
  }

  const sizeMB = await measureMB(uri, opts.reportedSizeMB);

  // Skip compression for short/small clips — preserve quality and skip
  // the few seconds of transcode time.
  if (sizeMB > 0 && sizeMB < NEEDS_COMPRESSION_MB) {
    return { uri, sizeMB, compressed: false, reason: "small-enough" };
  }

  // Lazy require so the web bundle never tries to resolve the native module.
  let Compressor: typeof import("react-native-compressor").Video | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Compressor = require("react-native-compressor").Video;
  } catch (err) {
    console.warn("[compressVideo] react-native-compressor unavailable:", err);
    return { uri, sizeMB, compressed: false, reason: "module-unavailable" };
  }

  if (!Compressor) {
    return { uri, sizeMB, compressed: false, reason: "module-unavailable" };
  }

  try {
    // `auto` keeps the original aspect ratio and bitrate-targets H.264 / AAC
    // in an MP4 container on both iOS (AVAssetExportSession) and Android
    // (MediaCodec). `maxSize: 1280` caps the longer edge at 720p without
    // upscaling, which is plenty for a social feed.
    const compressedUri = await Compressor.compress(
      uri,
      {
        compressionMethod: "auto",
        maxSize: 1280,
        minimumFileSizeForCompress: NEEDS_COMPRESSION_MB,
      },
      (pct) => opts.onProgress?.(pct),
    );
    const newSize = await measureMB(compressedUri);
    return {
      uri: compressedUri,
      sizeMB: newSize || sizeMB,
      compressed: compressedUri !== uri,
    };
  } catch (err) {
    // Graceful fallback — never block the upload because the transcoder
    // had a hiccup. The original file will be uploaded as-is.
    console.warn("[compressVideo] failed, uploading original:", err);
    return { uri, sizeMB, compressed: false, reason: "compress-failed" };
  }
}
