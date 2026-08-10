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
    
    // Test 1: nested array
    try {
      await setDoc(ref, { myField: [ [1] ] });
    } catch(e) {
      console.log('Nested array error:', e.message);
    }
    
    // Test 2: object with property "array" containing undefined
    try {
      await setDoc(ref, { array: [ undefined ] });
    } catch(e) {
      console.log('Property array with undefined error:', e.message);
    }

    // Test 3: array with undefined
    try {
      await setDoc(ref, { canvasElements: [ undefined ] });
    } catch(e) {
      console.log('canvasElements with undefined error:', e.message);
    }

    // Test 4: nested array in canvasElements
    try {
      await setDoc(ref, { canvasElements: [ { pts: [[1]] } ] });
    } catch(e) {
      console.log('canvasElements with nested array error:', e.message);
    }

  } catch (e) {
    console.error("Outer error:", e);
  }
  process.exit(0);
}
run();
