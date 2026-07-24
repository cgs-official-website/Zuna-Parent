const admin = require('firebase-admin');

// 1. Download your service account key from Firebase Console -> Project Settings -> Service Accounts
// 2. Place it in the same directory as this script and rename it to 'serviceAccountKey.json'
// 3. Run: npm install firebase-admin
// 4. Run: node create_admin.js

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function createAdmin() {
  const email = "admin@zuna.com";
  const password = "Cgs@001a";

  try {
    console.log(`Checking if user ${email} exists...`);
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('User already exists. Updating password...');
      await auth.updateUser(userRecord.uid, { password });
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        console.log('Creating new user...');
        userRecord = await auth.createUser({
          email,
          password,
          emailVerified: true
        });
      } else {
        throw e;
      }
    }

    const uid = userRecord.uid;
    console.log(`User UID: ${uid}`);

    console.log('Creating admin document in Firestore...');
    await db.collection('admins').doc(uid).set({
      email: email,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Successfully created admin user and matching document!');
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    process.exit();
  }
}

createAdmin();
