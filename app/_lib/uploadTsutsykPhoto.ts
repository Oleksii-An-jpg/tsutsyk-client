import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/app/_lib/firebase';

export async function uploadTsutsykPhoto(tsutsykId: string, file: File): Promise<string> {
    const storageRef = ref(storage, `tsutsyk-photos/${tsutsykId}/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file, { contentType: file.type });
    return getDownloadURL(storageRef);
}
