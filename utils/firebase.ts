import * as firebase from "firebase/app";
import "firebase/database";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_URL,
};

export default (function firebaseInit() {
  if (firebase.apps.length === 0) firebase.initializeApp(config);
  return firebase;
})();
