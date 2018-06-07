/* jshint esversion: 6 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.2.0/workbox-sw.js");
importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

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

// own caching strategy for database get requests
workbox.routing.registerRoute(
  /.*(?:pwagramma\.firebaseio\.com\/posts|pwagramma\.firebaseio\.com\/subscriptions)\.json.*$ / ,
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
            console.log('[Service Worker] cloned response from fetching', event.request.url, data);
            for (var key in data) {
              writeData('posts', data[key]);
            }
          });
        return res; // return the original response to the frontend javascript app
      });
  }
);




