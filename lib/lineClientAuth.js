import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Public Firebase configuration, same project/persisted login as the existing site.
export function lineAdminAuth() {
  const app = getApps().some(item => item.name === '[DEFAULT]') ? getApp() : initializeApp({
    apiKey: 'AIzaSyDsEeGxKA90-URCn06F-K3U2dvlISf_2Jo',
    authDomain: 'startup-up-realestate.firebaseapp.com',
    projectId: 'startup-up-realestate',
    appId: '1:750265634166:web:a4f6cd0a59db8c685fbe57',
  });
  return getAuth(app);
}
