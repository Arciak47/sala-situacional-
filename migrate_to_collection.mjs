import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBGHLn6pQ7HxOoa83r_unMgmoMWUdP_3K8',
  authDomain: 'sala-de-monitoreo.firebaseapp.com',
  projectId: 'sala-de-monitoreo',
  storageBucket: 'sala-de-monitoreo.firebasestorage.app',
  messagingSenderId: '693329094285',
  appId: '1:693329094285:web:3109334a8e3f5ee4d624c4'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
  console.log('Starting migration to submission_images...');
  const colRef = collection(db, 'submissions');
  const snapshot = await getDocs(colRef);
  let count = 0;

  for (const document of snapshot.docs) {
    const data = document.data();
    if (data.reportData && data.reportData.evidenceImageSrc && data.reportData.evidenceImageSrc.startsWith('data:')) {
      console.log('Migrating submission:', document.id);
      try {
        const imageId = 'img_' + document.id;
        // Save to new collection
        await setDoc(doc(db, 'submission_images', imageId), {
          subId: document.id,
          evidenceImageSrc: data.reportData.evidenceImageSrc
        });
        
        // Remove from submission and link it
        data.reportData.evidenceImageSrc = null;
        data.reportData.evidenceImageId = imageId;
        
        await setDoc(doc(db, 'submissions', document.id), data, { merge: true });
        console.log('Success for:', document.id);
        count++;
      } catch (err) {
        console.error('Error for', document.id, err);
      }
    }
  }
  console.log('Migration complete! Migrated ' + count + ' records.');
  process.exit(0);
}

migrate();