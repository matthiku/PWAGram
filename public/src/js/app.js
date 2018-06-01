
var deferredPrompt;

var enableNotificationsButtons = document.querySelectorAll('.enable-notifications');

if (!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function () {
      console.log('Service worker registered!');
    })
    .catch(function(err) {
      console.log(err);
    });
}

// add logic to prompt user to install this App to their homescreen
window.addEventListener('beforeinstallprompt', function(event) {
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

// confirm that we got permission to display notifications
function displayConfirmNotification() {
  // optional(!) options
  var options = {
    body: 'You successfully subscribed to our notifications.',
    icon: '/src/images/icons/app-icon-144x144.png',
    image: '/src/images/sf-boat.jpg',
    vibrate: [100, 50, 200], // vibration pattern: e.g. vibrate, pause, vibrate
    badge: '/src/images/icons/app-icon-96x96.png',
    tag: 'confirm-notification', // like an id for this notif.; using the same combines subsequent ones
    renotify: true, // false: make notficications very passive
    actions: [
      { action: 'confirm', title: 'OK', icon: '/src/images/icons/app-icon-96x96.png' },
      { action: 'cancel', title: 'Cancel', icon: '/src/images/icons/app-icon-96x96.png' }
    ]
  };
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(function (swreg) {
        swreg.showNotification('Successfully subscribed', options);
      });
  } else  {
    // send notification without using a service worker
    new Notification('Successfully subscribed!', options);
  }  
}

// also subscribe the user niow to PUSH NOTIFICATIONS
function configurePushSubscription() {
  if (!('serviceWorker' in navigator)) return;

  var reg;
  navigator.serviceWorker.ready
    .then(function (swreg) {
      reg = swreg;
      return swreg.pushManager.getSubscription();
    })
    .then(function (sub) {
      if (sub === null) {
        console.log('creating a new subscription', sub);
        // create a new subscription
        var vapidPublicKey = 'BLXjpE6I0smTQdgFYoqsZOiKTDbL3h3APdsIW22G3ZhkrnON6qetR5sXl8jiiMqNHx9oxqTF5yfKHzxZcgVpRUE';
        // return the new subscr as a promise
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
      } else {
        // do nothing for now, as we already have a subscription
        console.log('browser/client is already subscribed to this!');
      }
    })
    .then(function (newSubscr) {
      // store the new subscription on our backend server (here: firebase)
      return fetch('https://pwagramma.firebaseio.com/subscriptions.json', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(newSubscr)
      });
    })
    .then(function (res) {
      if (res.ok) {
        displayConfirmNotification();
      } else {
        console.log('saving new subscr to backend failed!');
      }
    })
    .catch(err => console.log(err));
}

// add logic to handle the "Enable notification" button clicks
function askForNotificationPermission() {
  // the popup will only ever appear once!
  Notification.requestPermission(function (result) {
    console.log('User choice', result);
    if (result !== 'granted') {
      console.log('No notifications permission granted by user');      
    } else {
      configurePushSubscription();
      // displayConfirmNotification(); (just for demo purposes)
      // perhaps hide buttons now
    }
  });
}
// first, enable the button if the feature is available in the browser
if ('Notification' in window) {
  enableNotificationsButtons.forEach(el => {
    el.style.display = 'inline-block';
    el.addEventListener('click', askForNotificationPermission);
  });
  
}