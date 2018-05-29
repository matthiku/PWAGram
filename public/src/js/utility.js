/**
 * utility.js - centralised access to indexedDB
 */

/**
 * get access to the indexedDB database for caching dynamic data
 */
var dbPromise = idb.open('post-store', 1, function (db) {
  if (!db.objectStoreNames.contains('posts')) {
    db.createObjectStore('posts', {
      keyPath: 'id'
    });
  }
});

/**
 * writeData - write data into indexedDB
 * 
 * @param {string} store name of the object sore
 * @param {object} data data to be written
 */
function writeData(store, data) {
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