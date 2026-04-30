import { ref, uploadBytes, getDownloadURL, type StorageReference } from "firebase/storage";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";

// Read any URI (file://, ph://, blob:, https://, content://) into a Blob the
// Firebase Storage SDK can upload. We use XMLHttpRequest because React
// Native's `fetch()` cannot read `blob:` URLs returned by some image pickers
// (notably the iOS PHPicker flow inside Expo Go) — it throws "No suitable
// URL request handler found for blob:..." and the upload silently fails.
// XHR's responseType=blob path works for every URI scheme React Native
// supports.
export function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      const res = xhr.response as Blob | null;
      if (res) resolve(res);
      else reject(new Error("Empty blob from URI"));
    };
    xhr.onerror = () => reject(new Error(`Failed to read URI: ${uri}`));
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
}

// iOS in Expo Go sometimes hands us a `blob:https://...expo.dev/...` URI
// from the picker. Native modules like `ImageManipulator` (and any iOS
// fetch handler) crash on these with "No suitable URL request handler
// found for blob:...". Browsers understand blob:, but iOS native code does
// not. To make the URI usable by native modules we materialize the blob
// into a real file in the app's cache directory and return that file://
// URI. JS-side XHR can read blob: directly, so we only do this when we're
// about to hand the URI to a native module.
async function materializeBlobUriToFile(blobUri: string): Promise<string> {
  const blob = await uriToBlob(blobUri);
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(",");
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error("Failed to read blob as data URL"));
    reader.readAsDataURL(blob);
  });
  const mime = blob.type ?? "";
  const ext = mime.includes("png") ? "png"
    : mime.includes("webp") ? "webp"
    : mime.includes("mp4") ? "mp4"
    : mime.includes("quicktime") ? "mov"
    : mime.includes("audio") ? "m4a"
    : "jpg";
  const filePath = `${FileSystem.cacheDirectory}upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await FileSystem.writeAsStringAsync(filePath, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return filePath;
}

// Compress + resize a JPEG/PNG image to keep upload payload small. A typical
// 12MP iPhone photo is ~4MB; after this it's ~150–400KB while still looking
// great inline on a phone screen. This is the single biggest contributor to
// "posting feels slow" on mobile data, so we run it for every image upload.
//
// Important: ImageManipulator runs in native iOS code which cannot read
// `blob:` URIs (it throws "No suitable URL request handler found for
// blob:..."). If we get one, we first copy the blob to a file:// URI in
// the cache directory so the native module can open it.
export async function compressImageForUpload(uri: string): Promise<string> {
  try {
    const inputUri = uri.startsWith("blob:")
      ? await materializeBlobUriToFile(uri)
      : uri;
    const result = await ImageManipulator.manipulateAsync(
      inputUri,
      [{ resize: { width: 1600 } }],
      { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG },
    );
    return result.uri;
  } catch {
    // If compression fails for any reason (rare — usually unsupported format)
    // we fall back to uploading the original so the user's post still goes
    // through.
    return uri;
  }
}

// Upload a local URI to Firebase Storage and return the download URL.
// Wraps the blob conversion + upload + URL fetch into one call so every
// caller (post media, chat media, avatars) handles URIs identically.
//
// Pass `compress: true` for user-supplied images to shrink them to a
// reasonable size before upload (≈10× smaller payload than a raw camera
// roll photo). We deliberately don't compress videos/audio here — both have
// their own codecs and re-encoding them on-device would be slow and lossy.
export async function uploadUriToStorage(
  uri: string,
  storageRef: StorageReference,
  contentType: string,
  options?: { compress?: boolean },
): Promise<string> {
  let sourceUri: string;
  if (options?.compress && contentType.startsWith("image/")) {
    sourceUri = await compressImageForUpload(uri);
  } else if (uri.startsWith("blob:")) {
    // Even when we skip compression (videos, audio) we still need to
    // normalize blob: URIs to file:// so any downstream native code
    // (and our XHR-based reader) gets a stable, file-backed source.
    sourceUri = await materializeBlobUriToFile(uri);
  } else {
    sourceUri = uri;
  }
  const blob = await uriToBlob(sourceUri);
  await uploadBytes(storageRef, blob, { contentType });
  return await getDownloadURL(storageRef);
}

export { ref };
