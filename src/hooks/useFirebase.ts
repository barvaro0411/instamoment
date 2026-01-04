import { useState, useCallback } from 'react';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    Timestamp,
    deleteDoc,
    doc,
    type DocumentData
} from 'firebase/firestore';
import { storage, db } from '../lib/firebase';

export interface Photo {
    id: string;
    imageUrl: string;
    author: string;
    filter: string;
    timestamp: Date;
    eventId: string;
}

interface UseFirebaseReturn {
    photos: Photo[];
    isLoading: boolean;
    uploadError: string | null;
    uploadPhoto: (dataUrl: string, author: string, filter: string, eventId: string) => Promise<boolean>;
    subscribeToPhotos: (eventId: string) => () => void;
    deletePhoto: (photoId: string, eventId: string, imageUrl?: string) => Promise<boolean>;
}

export const useFirebase = (): UseFirebaseReturn => {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const uploadPhoto = useCallback(async (
        dataUrl: string,
        author: string,
        filter: string,
        eventId: string
    ): Promise<boolean> => {
        setIsLoading(true);
        setUploadError(null);

        try {
            // Generate unique filename
            const timestamp = Date.now();
            const filename = `${eventId}/${timestamp}_${Math.random().toString(36).substr(2, 9)}.jpg`;

            // Upload to Firebase Storage
            const storageRef = ref(storage, `photos/${filename}`);
            await uploadString(storageRef, dataUrl, 'data_url');

            // Get download URL
            const downloadUrl = await getDownloadURL(storageRef);

            // Save metadata to Firestore
            await addDoc(collection(db, 'events', eventId, 'photos'), {
                imageUrl: downloadUrl,
                author: author || 'Anónimo',
                filter: filter,
                timestamp: Timestamp.now(),
                eventId: eventId
            });

            setIsLoading(false);
            return true;
        } catch (err) {
            console.error('Upload error:', err);
            setUploadError(err instanceof Error ? err.message : 'Error al subir la foto');
            setIsLoading(false);
            return false;
        }
    }, []);

    const subscribeToPhotos = useCallback((eventId: string) => {
        const photosRef = collection(db, 'events', eventId, 'photos');
        const q = query(photosRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newPhotos: Photo[] = snapshot.docs.map((doc) => {
                const data = doc.data() as DocumentData;
                return {
                    id: doc.id,
                    imageUrl: data.imageUrl,
                    author: data.author,
                    filter: data.filter,
                    timestamp: data.timestamp?.toDate() || new Date(),
                    eventId: data.eventId
                };
            });
            setPhotos(newPhotos);
        }, (error) => {
            console.error('Firestore subscription error:', error);
        });

        return unsubscribe;
    }, []);

    const deletePhoto = useCallback(async (photoId: string, eventId: string, imageUrl?: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            // 1. Delete from Firestore
            await deleteDoc(doc(db, 'events', eventId, 'photos', photoId));

            // 2. Delete from Storage (if we can derive ref)
            // Ideally we should store the storage path ref in firestore.
            // But we can try to ref from URL if permitted or if we have a pattern.
            // Our pattern: photos/${filename}
            // URL contains the token and full path. 
            // ref(storage, url) supports full HTTP URLs for deleteObject! 
            if (imageUrl) {
                try {
                    const imageRef = ref(storage, imageUrl);
                    await deleteObject(imageRef);
                } catch (storageErr) {
                    console.warn('Could not delete file from storage, might handle manually or ignore', storageErr);
                }
            }

            return true;
        } catch (error) {
            console.error('Error deleting photo:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        photos,
        isLoading,
        uploadError,
        uploadPhoto,
        subscribeToPhotos,
        deletePhoto
    };
};
