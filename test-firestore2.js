const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  projectId: "dummy-project",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    const ref = doc(db, 'test', 'test');
    
    try {
      await setDoc(ref, [ { a: 1 } ]);
    } catch(e) {
      console.log('Passing array to setDoc error:', e.message);
    }
  } catch (e) {
    console.error("Outer error:", e);
  }
  process.exit(0);
}
run();
