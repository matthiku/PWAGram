
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
        swreg.showNotification('Successfully subscribed (from SWReg)', options);
      });
  } else  {
    // send notification without using a service worker
    new Notification('Successfully subscribed!', options);
  }  
}

// add logic to handle the "Enable notification" button clicks
function askForNotificationPermission() {
  // the popup will only ever appear once!
  Notification.requestPermission(function (result) {
    console.log('User choice', result);
    if (result !== 'granted') {
      console.log('No notifications permission granted by user');      
    } else {
      displayConfirmNotification();
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