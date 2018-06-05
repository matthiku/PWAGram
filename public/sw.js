/* jshint esversion: 6 */

importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

var CACHE_STATIC_NAME = 'static-v11';
var CACHE_DYNAMIC_NAME = 'dynamic-v8';
var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/utility.js',
  '/src/js/idb.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];
// var backendUrl = 'https://us-central1-pwagramma.cloudfunctions.net/storePostData';



/**
 * trimCache - maintain size of a cache
 * 
 * @param {string} cacheName Name of the cache to be managed
 * @param {integer} maxItems max. number of items to remain in this cache
 */
function trimCache(cacheName, maxItems) {
  caches.open(cacheName)
  .then(function (cache) {
    return cache.keys() // return the array of cache keys
    .then(function (keys) {
      if (keys.length > maxItems) {
        console.log('[Service Worker]', cacheName, 'cleaning up old items -', keys[0]);
        // delete the oldest item in the cache, then 
        //    recursively call this function until maxItems is reached
        cache.delete(keys[0])
        .then(trimCache(cacheName, maxItems));
      }
    });
  });
}

/**
 * SW INSTALLATION phase
 * 
 * - cache all static pages
 */
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

/**
 * 
 * SW ACTIVATION phase
 * 
 * 
 * - delete outdated caches
 */
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
function isInArray(string, array) {
  var cachePath;
  if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

/**
 * 
 * Intercept any fetch request and use various caching strategies
 * 
 * 
 * A) for dynamic data requests, use "Cache, then also Network (with caching)"
 * 
 * b) for static pages, use "Cache only"
 * 
 * c) for dynamic pages, use "Cache with fallback to network (with caching)"
 * 
 * 
 */
self.addEventListener('fetch', function (event) {

  // requests like API calls need to have their own strategy
  var urlArray = [
    'https://pwagramma.firebaseio.com/posts.json',
    'https://pwagramma.firebaseio.com/subscriptions.json'
  ];

  /**
   * A) Use Cache AND make a Network fetch, then cache everything!
   */
  if (isInArray(event.request.url, urlArray) && event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
      .then(function (res) {
        var clonedRes = res.clone();
        clearAllData('posts')
          .then(function () {
            return clonedRes.json();
          })
          .then(function (data) {
            // loop through each item in the data object from firebase
            console.log('[Service Worker] cloned response from fetching', event.request.url, data);
            for (var key in data) {
              writeData('posts', data[key]);
            }
          });
        return res; // return the original response to the frontend javascript app
      })
    );

  // check if the requested url is part of the static assets
  } else if (isInArray(event.request.url, STATIC_FILES)) {
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
        .then(function (cachedResponse) {
          if (cachedResponse) {
            // the request was found in the cache!
            console.log('[Service Worker] fetching this from Cache -', event.request.url);
            return cachedResponse;
          } else {
            // request/response wasn't found, so we make the network request and return the response,
            // but also store the repsponse in our cache
            return fetch(event.request)
              .then(function (resp) {
                return caches.open(CACHE_DYNAMIC_NAME)
                  .then(function (cache) {
                    // trimCache(CACHE_DYNAMIC_NAME, 9);
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
                    // basically for all generic HTML page requests
                    if (event.request.headers.get('accept').includes('text/html'))
                      return cache.match('/offline.html');
                    // this can also be improved to return a placeholder image for image requests!
                    // but it must be part of the static resources stored during the INSTALLATION of the SW!
                  });
              });
          }
        })
    );
  }

});


/**
 * Listen to SYNC events
 * 
 * and act depending on the tag name of the sync event 
 */
self.addEventListener('sync', function (event) {
  console.log('[Service Worker] Background Syncing,', event);
  if (event.tag === 'sync-new-post') {
    console.log('[Service Worker]  Syncing new post');
    event.waitUntil(
      // get all posts waiting to be synced
      readAllData('syncPosts')
        .then(function (data) {
          // loop through each single post
          for (var dt of data) {
            sendData(backendUrl, dt)
              .then(function(res) {
                console.log('[Service Worker]  New post was sent', res);
                // clean up the post that has successfuly been sent to the backend
                if (res.ok) {
                  res.json()
                    .then(function (resData) {
                      deleteItemFromData('syncPosts', resData.id); 
                    });
                }
              });
          }
        })
    );
  }
});


/**
 * Listen to CLICK events on Notifications
 */
self.addEventListener('notificationclick', function (event) {
  console.log(event);
  var notification = event.notification;
  if (event.action === 'confirm') {
    // do nothing else for now...
    notification.close();
  } else {
    console.log(event.action);
    // open a new window (or tab) in the browser
    event.waitUntil(
      // refers to all windows or browser tasks related to this service worker
      clients.matchAll()
      .then((clientsArr) => {
        // find windows which are open or visible
        var client = clientsArr.find((c) => {
          return c.visibiityState === 'visible';
        });
        if (client !== undefined) {
          client.navigate(notification.data.url);
          client.focus();
        } else {
          clients.openWindow(notification.data.url);
        }
        notification.close();
      })
    );
  }
});

/**
 * Listen to CLOSE events from Notifications
 */
self.addEventListener('notificationclose', function (event) {
  console.log(event);
});


/**
 * Listen to PUSH NOTIFICATIONS 
 */
self.addEventListener('push', (event) => {
  console.log('Push notification received', event);

  // receive the notification
  var data = { // initial dummy values
    title: 'New',
    content: 'Something new happended',
    openUrl: '/'
  };
  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  // show the notification
  var options = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    badge: '/src/images/icons/app-icon-96x96.png',
    data: {
      url: data.openUrl
    }
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
