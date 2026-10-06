import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBGHLn6pQ7HxOoa83r_unMgmoMWUdP_3K8",
  authDomain: "sala-de-monitoreo.firebaseapp.com",
  projectId: "sala-de-monitoreo",
  storageBucket: "sala-de-monitoreo.firebasestorage.app",
  messagingSenderId: "693329094285",
  appId: "1:693329094285:web:3109334a8e3f5ee4d624c4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkLisbeth() {
  const colRef = collection(db, 'submissions');
  const q = query(colRef, where('analystEmail', '==', 'lisbeth.sarmiento.315@gmail.com'));
  const snap = await getDocs(q);
  
  const docs = [];
  snap.forEach(d => {
    const data = d.data();
    if (data.status !== 'rechazado') docs.push(data);
  });
  
  const now = new Date();
  let monthCount = 0;
  let weekCount = 0;
  
  docs.forEach(data => {
    const ts = data.timestamp || data.fechaHora || '';
    const tsDate = ts ? new Date(ts) : null;
    if (!tsDate) return;
    
    // Check local month
    const isThisMonth = tsDate.getFullYear() === now.getFullYear() && tsDate.getMonth() === now.getMonth();
    
    // Check local week
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diffToMonday = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    const isThisWeek = tsDate >= startOfWeek;
    
    if (isThisMonth) {
      console.log(`OCTOBER REPORT: ${tsDate.toISOString()} - Status: ${data.status}`);
      monthCount++;
    }
  });
  
  console.log('---');
  console.log('Total in October (non-rejected):', monthCount);
}

checkLisbeth().catch(console.error).then(() => process.exit(0));
