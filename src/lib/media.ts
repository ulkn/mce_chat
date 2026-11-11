import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

import { storage } from './firebase';

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size: number | null;
  width: number | null;
  height: number | null;
};

export type Uploaded = {
  url: string;
  path: string;
  size: number;
};

// Yerel dosyayı (file://) yüklemeye hazır bir Blob'a çevirir.
function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('Dosya okunamadı.'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

function randomId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function extensionOf(name: string, fallback: string): string {
  const m = /\.([a-zA-Z0-9]{1,8})$/.exec(name);
  return m ? m[1].toLowerCase() : fallback;
}

export async function uploadFile(
  path: string,
  uri: string,
  contentType: string,
  onProgress?: (fraction: number) => void
): Promise<Uploaded> {
  const blob = await uriToBlob(uri);
  try {
    if (blob.size > MAX_UPLOAD_BYTES) {
      throw new Error('Dosya 25 MB sınırını aşıyor.');
    }
    const task = uploadBytesResumable(ref(storage, path), blob, { contentType });
    await new Promise<void>((resolve, reject) => {
      task.on(
        'state_changed',
        (snap) => onProgress?.(snap.totalBytes > 0 ? snap.bytesTransferred / snap.totalBytes : 0),
        reject,
        () => resolve()
      );
    });
    const url = await getDownloadURL(task.snapshot.ref);
    return { url, path, size: blob.size };
  } finally {
    // React Native'de Blob bellekte kalır; işi bitince serbest bırak.
    (blob as Blob & { close?: () => void }).close?.();
  }
}

export function chatMediaPath(chatId: string, uid: string, fileName: string, fallbackExt: string): string {
  return `chats/${chatId}/${uid}/${randomId()}.${extensionOf(fileName, fallbackExt)}`;
}

export function avatarPath(uid: string): string {
  return `avatars/${uid}/${randomId()}.jpg`;
}

function fromImageAsset(asset: ImagePicker.ImagePickerAsset): PickedFile {
  return {
    uri: asset.uri,
    name: asset.fileName ?? 'foto.jpg',
    mimeType: asset.mimeType ?? 'image/jpeg',
    size: asset.fileSize ?? null,
    width: asset.width,
    height: asset.height,
  };
}

export async function pickImage(options?: { square?: boolean }): Promise<PickedFile | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    allowsEditing: options?.square === true,
    aspect: options?.square ? [1, 1] : undefined,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return fromImageAsset(result.assets[0]);
}

export async function takePhoto(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Kamera izni verilmedi. Ayarlar > Yaren bölümünden izin verebilirsin.');
  }
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
  if (result.canceled || result.assets.length === 0) return null;
  return fromImageAsset(result.assets[0]);
}

export async function pickDocument(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType ?? 'application/octet-stream',
    size: asset.size ?? null,
    width: null,
    height: null,
  };
}
