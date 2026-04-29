import { ref, uploadBytes, getDownloadURL, type StorageReference } from "firebase/storage";

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

// Upload a local URI to Firebase Storage and return the download URL.
// Wraps the blob conversion + upload + URL fetch into one call so every
// caller (post media, chat media, avatars) handles URIs identically.
export async function uploadUriToStorage(
  uri: string,
  storageRef: StorageReference,
  contentType: string,
): Promise<string> {
  const blob = await uriToBlob(uri);
  await uploadBytes(storageRef, blob, { contentType });
  return await getDownloadURL(storageRef);
}

export { ref };
