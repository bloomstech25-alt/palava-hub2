import { ref, uploadBytes, getDownloadURL, type StorageReference } from "firebase/storage";
import * as ImageManipulator from "expo-image-manipulator";

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

// Compress + resize a JPEG/PNG image to keep upload payload small. A typical
// 12MP iPhone photo is ~4MB; after this it's ~150–400KB while still looking
// great inline on a phone screen. This is the single biggest contributor to
// "posting feels slow" on mobile data, so we run it for every image upload.
export async function compressImageForUpload(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
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
  const sourceUri = options?.compress && contentType.startsWith("image/")
    ? await compressImageForUpload(uri)
    : uri;
  const blob = await uriToBlob(sourceUri);
  await uploadBytes(storageRef, blob, { contentType });
  return await getDownloadURL(storageRef);
}

export { ref };
