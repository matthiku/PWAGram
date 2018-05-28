var CACHE_STATIC_NAME = 'static-v13';
var CACHE_DYNAMIC_NAME = 'dynamic-v1';
var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  // wait until the caching is done before we finish the installation event
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME) // use versioning to prevent the cache becoming outdated
      .then(function (cache) {
        console.log('[Service Worker] Pre-caching App shell');
        cache.addAll(STATIC_FILES);
      })
  );
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker ....', event);
  // here we can cleanup old and outdated caches
  // yet let the 'activate' event wait until this step is done
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
  );
  return self.clients.claim();
});

// helper function to check if URL is found in the provided array
const isInCache = (requestURL, cacheArr) => cacheArr.some(url => url === requestURL.replace(self.origin, ''));

self.addEventListener('fetch', function (event) {

  // requests like API calls need to have their own strategy
  var url = 'https://httpbin.org/get';

  /**
   * A) Use Cache AND make a Network fetch, then cache everything!
   */
  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      caches.open(CACHE_DYNAMIC_NAME)
        .then(function (cache) {
          return fetch(event.request)
            .then(function (res) {
              cache.put(event.request, res.clone());
              return res;
            });
        })
    );

  // check if the requested url is part of the static assets
  } else if (isInCache(event.request.url, STATIC_FILES)) {
    // then use the "cache-only" strategy
    event.respondWith(
      caches.match(event.request)
    );
  } else {
    /**
     * B) Try cache first and only do a Network fetch if not found - then cache it
     */
    event.respondWith(
      // check if we have the response to this request already in our cache
      caches.match(event.request)
        .then(function (response) {
          if (response) {
            // the request was found in the cache!
            console.log('[Service Worker] fetching this from Cache -', event.request.url);
            return response;
          } else {
            // request/response wasn't found, so we make the network request and return the response,
            // but also store the repsponse in our cache
            return fetch(event.request)
              .then(function (resp) {
                return caches.open(CACHE_DYNAMIC_NAME)
                  .then(function (cache) {
                    // we need to clone the response as response can only used once
                    cache.put(event.request.url, resp.clone());
                    console.log('[Service Worker] adding to dynamic cache -', event.request.url);
                    return resp; // return the response to the web page
                  });
              })
              .catch(function (err) {
                // use a fallback page if we haven't cached the requested page yet
                return caches.open(CACHE_STATIC_NAME)
                  .then(function (cache) {
                    // only return the default page if it makes sense (e.g. not for CSS files)
                    if (event.request.url.endsWith('/help'))
                      return cache.match('/offline.html');
                  });
              });
          }
        })
    );
  }

});
