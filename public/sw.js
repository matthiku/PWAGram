var CACHE_STATIC_NAME = 'static-v4';
var CACHE_DYNAMIC_NAME = 'dynamic';

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  // make sure the cache is filled before we finish the installation event
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME) // user versioning to prevent the cache becoming outdated
      .then(function (cache) {
        console.log('[Service Worker] Pre-caching App shell');
        cache.addAll([
          '/',
          '/index.html',
          '/src/js/app.js',
          '/src/js/feed.js',
          '/src/js/material.min.js',
          '/src/css/app.css',
          '/src/css/feed.css',
          '/src/images/main-image.jpg',
          'https://fonts.googleapis.com/css?family=Roboto:400,700',
          'https://fonts.googleapis.com/icon?family=Material+Icons',
          'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
        ]);
      })
  );
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker ....', event);
  // here we can cleanup old and outdated caches
  event.waitUntil(
    caches.keys()
      .then(function (keyList) {
        // wait until all keys are available
        return Promise.all(keyList.map(function (key) {
          // don't delete the current or the dynamic stuff in the cache
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('[Service Worker] removing old cache -', key);
            return caches.delete(key);
          }
        }));
      })
  )
  return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    // check if we have the response to this request already in our cache
    caches.match(event.request)
      .then(function (response) {
        if (response) {
          console.log('[Service Worker] fetching this from Cache -', event.request.url);
          return response;
        } else {
          // request/response wasn't found, so we make the request and return the response,
          // but also store the repsponse in our cache
          return fetch(event.request)
            .then(function (resp) {
              return caches.open(CACHE_DYNAMIC_NAME)
                .then(function (cache) {
                  // we need to clone the response as response can only used once
                  cache.put(event.request.url, resp.clone());
                  return resp;
                });
            })
            .catch(function (err) {
              console.log(err);
            });
        }
      })
  );
});