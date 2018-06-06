importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.2.0/workbox-sw.js");

// fonts etc. should be cached and fetched from cache first, then validated from the network
workbox.routing.registerRoute(
  /.*(?:googleapis|gstatic)\.com.*$/,
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

// images from posts
workbox.routing.registerRoute(
  /.*(?:firebasestorage\.googleapis)\.com.*$/,
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'post-images'
  })
);

workbox.precaching.precacheAndRoute([
  {
    "url": "404.html",
    "revision": "0a27a4163254fc8fce870c8cc3a3f94f"
  },
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "14f42aca2a6a2ca14b1bd3f84511f49f"
  },
  {
    "url": "manifest.json",
    "revision": "d11c7965f5cfba711c8e74afa6c703d7"
  },
  {
    "url": "offline.html",
    "revision": "4a24f3131b1ae426fc0d6ef519b842d2"
  },
  {
    "url": "src/css/app.css",
    "revision": "c1a24ae40e8c0d0dadd8601956275c0f"
  },
  {
    "url": "src/css/feed.css",
    "revision": "0bf525f26aa5ba92307349f5c5c678e0"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/js/app.js",
    "revision": "55351740f7deedd6d58762e1cbfdef7d"
  },
  {
    "url": "src/js/feed.js",
    "revision": "7cef3ad20f36e83937a2c0dffbb91f6d"
  },
  {
    "url": "src/js/fetch.js",
    "revision": "6b82fbb55ae19be4935964ae8c338e92"
  },
  {
    "url": "src/js/idb.js",
    "revision": "963dae3b8a157f2883c33a746cb6276d"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/promise.js",
    "revision": "10c2238dcd105eb23f703ee53067417f"
  },
  {
    "url": "src/js/utility.js",
    "revision": "9b17aa7d63b07203dc3db740d851a39b"
  },
  {
    "url": "sw-base.js",
    "revision": "ba3b31a0a7b218e7252465e4528f9342"
  },
  {
    "url": "sw.js",
    "revision": "1bd3d97d01eaad2f3a913d2e4a0539db"
  },
  {
    "url": "test.html",
    "revision": "4c7d8e83639610f59ddca89df9b9de29"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }
]);