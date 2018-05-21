// will store the event that shows the install-on-homescreen prompt
var deferredPrompt;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function () {
      console.log('service worker registered!');
    });
}

window.addEventListener('beforeinstallprompt', function (event) {
  console.log('beforeinstallprompt fired');
  deferredPrompt = event;
  event.preventDefault();
  return false;
});
