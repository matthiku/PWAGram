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


// demo of the fetch API which uses promises
fetch('https://httpbin.org/post', {
  method: 'POST', // 'GET' is the default
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({
    ruelps: 'kapuelps'
  })
})
  .then(function (response) {
    console.log(response);
    return response.json();
  })
  .then(function (data) {
    console.log(data);
  })
  .catch(function (err) {
    console.log(err);
  });