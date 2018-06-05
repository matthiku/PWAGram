/* jshint esversion: 6 */

/**
 * utility.js - centralised access to indexedDB
 */
const backendUrl = 'https://us-central1-pwagramma.cloudfunctions.net/storePostData';

/**
 * get access to the indexedDB database for caching dynamic data
 * and make sure we have the object stoers we need for our application
 */
var dbPromise = idb.open('post-store', 1, function (db) {
  if (!db.objectStoreNames.contains('posts')) {
    db.createObjectStore('posts', {keyPath: 'id'});
  }
  if (!db.objectStoreNames.contains('syncPosts')) {
    db.createObjectStore('syncPosts', {keyPath: 'id'});
  }
});

/**
 * writeData - write data into indexedDB
 * 
 * @param {string} store name of the object sore
 * @param {object} data data to be written
 */
function writeData(store, data) {
  console.log('trying to write', data, 'to this store:', store);
  return dbPromise
    .then(function (db) {
      // create a new IDB transaction
      var tx = db.transaction(store, 'readwrite');
      // define the database to be used
      var st = tx.objectStore(store);
      // put the data into the store object
      st.put(data);
      // complete the transaction
      return tx.complete;
    });
}

/**
 * readAllData - read all data from a indexedDB object store
 * 
 * @param {string} store store name
 */
function readAllData(store) {
  return dbPromise
    .then(function (db) {
      var tx = db.transaction(store, 'readonly');
      var st = tx.objectStore(store);
      return st.getAll();
    });
}


/**
 * clearAllData - clear all data in a store
 * 
 * @param {string} storeName name of the store to be cleared
 */
function clearAllData(storeName) {
  return dbPromise
    .then(function (db) {
      var tx = db.transaction(storeName, 'readwrite');
      var store = tx.objectStore(storeName);
      store.clear();
      return tx.complete;
    });
}


/**
 * deleteItemFromData - delete a single item within an object store
 * 
 * @param {string} storeName 
 * @param {*} id 
 */
function deleteItemFromData(storeName, id) {
  return dbPromise
    .then(function (db) {
      var tx = db.transaction(storeName, 'readwrite');
      var store = tx.objectStore(storeName);
      store.delete(id);
      return tx.complete;
    })
    .then(function () {
      console.log('item deleted.');
    });
}


/**
 * sendData function - send data to the backend
 * 
 * @param {string} url URL address to be used
 * @param {object} data object with key/value pairs of data to be stored
 */
function sendData(url, data) {
  console.log('trying to send to', url, ' this data:', data);

  // send form data to a backend
  var postData = new FormData();
  postData.append('id', data.id);
  postData.append('title', data.title);
  postData.append('location', data.location);
  postData.append('file', data.image, data.id + '.ong');

  return fetch(url, {
      method: 'POST',
      body: postData
    });
}


/**
 * urlBase64ToUint8Array - converts strings to Uint8 arrays
 *
 * @param {string} base64String any string
 */
function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * dataURItoBlob - convert a base64 URL to a file
 * 
 * @param {string} dataURI base64 URL string
 */
function dataURItoBlob(dataURI) {
  var byteString = atob(dataURI.split(',')[1]);
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  var blob = new Blob([ab], {type: mimeString});
  return blob;
}