/* jshint esversion: 6 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.2.0/workbox-sw.js");

importScripts('/src/js/idb.js'); // indexedDB package
importScripts('/src/js/utility.js'); // our own utilities

/**
 * CACHING
 */
// static files
workbox.precaching.precacheAndRoute([]);

// images from posts
workbox.routing.registerRoute(
  /.*(?:firebasestorage\.googleapis)\.com.*$/,
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'post-images'
  })
);

// fonts etc. should be cached and fetched from cache first, then validated from the network
workbox.routing.registerRoute(
  /.*(?:fonts\.googleapis|gstatic)\.com.*$/,
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'google-fonts'
  })
);

// material design CSS file
workbox.routing.registerRoute(
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'material-css'
  })
);

// own caching strategy for backend database GET requests
workbox.routing.registerRoute(

  /.*(?:pwagramma\.firebaseio\.com\/posts|pwagramma\.firebaseio\.com\/subscriptions)\.json.*$/,

  (args) => {
    return fetch(args.event.request)
      .then(function (res) {
        var clonedRes = res.clone();
        clearAllData('posts')
          .then(function () {
            return clonedRes.json();
          })
          .then(function (data) {
            // loop through each item in the data object from firebase
            console.log('[Service Worker] cloned response from fetching', args.event.request.url, data);
            for (var key in data) {
              writeData('posts', data[key]);
            }
          });
        return res; // return the original response to the frontend javascript app
      });
  }
);



// providing a fallback page for HTML(!) content that is not cached
workbox.routing.registerRoute(

  // function must return true in order for this route to apply
  (routeData) => {
    // check if the request is accepting HTML pages as a response
    return (routeData.event.request.headers.get('accept').includes('text/html'));
  },

  (args) => {
    // check if we have the response to this request already in our cache
    return caches.match(args.event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // the request was found in the cache!
          console.log('[Service Worker] fetching this from Cache -', args.event.request.url);
          return cachedResponse;
        } else {
          // request/response wasn't found, so we make the network request and return the response,
          // but also store the repsponse in our cache
          return fetch(args.event.request)
            .then((resp) => {
              return caches.open('dynamic')
                .then((cache) => {
                  // trimCache(CACHE_DYNAMIC_NAME, 9);
                  // we need to clone the response as responses can only be used once!
                  cache.put(args.event.request.url, resp.clone());
                  console.log('[Service Worker] adding to dynamic cache -', args.event.request.url);
                  return resp; // return the response to the web page
                });
            })
            .catch(function (err) {
              // use a fallback page if we haven't cached the requested page yet
              return caches.match('/offline.html')
                .then( (cachedPage) => {
                  return cachedPage;
                });
            });
        }
      });
  }
);


/**
 * Listen to SYNC events
 * 
 * and act depending on the tag name of the sync event 
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background Syncing,', event);
  if (event.tag === 'sync-new-post') {
    console.log('[Service Worker]  Syncing new post');
    event.waitUntil(
      // get all posts waiting to be synced
      readAllData('syncPosts')
      .then((data) => {
        // loop through each single post
        for (var dt of data) {
          sendData(backendUrl, dt)
            .then((res) => {
              console.log('[Service Worker]  New post was sent', res);
              // clean up the post that has successfuly been sent to the backend
              if (res.ok) {
                res.json()
                  .then((resData) => {
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

  // receive the notification
  var data = { // initial dummy values
    title: 'New',
    content: 'Something new happended',
    openUrl: '/',
    preview: '/src/images/icons/app-icon-96x96.png'
  };
  if (event.data) {
    data = JSON.parse(event.data.text());
  }
  console.log('Push notification received', data);

  // show the notification
  var options = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    badge: '/src/images/icons/app-icon-96x96.png',
    image: data.preview,
    data: {
      url: data.openUrl
    }
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});


