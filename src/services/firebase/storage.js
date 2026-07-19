let _storage = null;

async function getStore() {
  if (_storage) return _storage;
  const { getStorage } = await import("firebase/storage");
  const { app } = await import("./config.js");
  _storage = getStorage(app);
  return _storage;
}

export async function uploadImage(path, file) {
  const { ref, uploadBytes, getDownloadURL } = await import(
    "firebase/storage"
  );
  const storage = await getStore();
  const storageRef = ref(storage, path);
  const snap = await uploadBytes(storageRef, file);
  return getDownloadURL(snap.ref);
}

export async function deleteImage(path) {
  const { ref, deleteObject } = await import("firebase/storage");
  const storage = await getStore();
  await deleteObject(ref(storage, path));
}
