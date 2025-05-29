importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyCk2LEXYTNhgrZiY3KXlsjylZdDD1KA13k",
  authDomain: "tsky-28991.firebaseapp.com",
  projectId: "tsky-28991",
  storageBucket: "tsky-28991.firebasestorage.app",
  messagingSenderId: "666432440443",
  appId: "1:666432440443:web:b50fa0df3b0a422d087ade",
  measurementId: "G-L5N0H3DKZ0",
});
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Received background message ", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
