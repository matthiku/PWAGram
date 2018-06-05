/* jshint esversion: 6 */

/**
 * 
 * This is the SERVER-SIDE code for our project, running on Firebase
 * 
 */

// includes
const functions = require('firebase-functions');
const webpush = require('web-push');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const fs = require('fs'); // file handling package
const os = require('os');
const path = require('path');
const UUID = require('uuid-v4'); // helper to create unique id strings
const Busboy = require("busboy");


// Create and Deploy Cloud Functions, see
//    https://firebase.google.com/docs/functions/write-firebase-functions


// see https://console.firebase.google.com/u/0/project/pwagramma/settings/serviceaccounts/adminsdk
var serviceAccount = require('./pwagramma-firebase-key.json');


// set up Google storage (our own firebase storage) access via google cloud services
var gcconfig = {
  projectId: 'pwagramma',
  keyFilename: 'pwagramma-firebase-key.json'
};
// require google cloud services and execute the returned function immediately
var gcs = require('@google-cloud/storage')(gcconfig);


admin.initializeApp({
  // where is the DB
  databaseURL: 'https://pwagramma.firebaseio.com/',
  // key file
  credential: admin.credential.cert(serviceAccount)
});

/**
 * server-side code to respond to incoming POST requests
 * 
 * saving new data to the database
 */
exports.storePostData = functions.https.onRequest(
  (request, response) => {
    cors(request, response, () => {
      var uuid = UUID(); // initialize UUID

      const busboy = new Busboy({
        headers: request.headers
      });
      // These objects will store the values (file + fields) extracted from busboy
      let upload;
      const fields = {};

      // This callback will be invoked for each file uploaded
      busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        console.log(
          `File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
        );
        const filepath = path.join(os.tmpdir(), filename);
        upload = {
          file: filepath,
          type: mimetype
        };
        file.pipe(fs.createWriteStream(filepath));
      });

      // This will be invoked on every field detected
      busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
        fields[fieldname] = val;
      });

      // This callback will be invoked after all uploaded files are saved.
      busboy.on("finish", () => {
        var bucket = gcs.bucket("YOUR_PROJECT_ID.appspot.com");
        bucket.upload(
          upload.file, {
            uploadType: "media",
            metadata: {
              metadata: {
                contentType: upload.type,
                firebaseStorageDownloadTokens: uuid
              }
            }
          },
          (err, file) => { // execute this once the file upload was successful
            if (!err) {
              // write the new post to the database
              admin.database().ref('posts').push({
                id: fields.id,
                title: fields.title,
                location: fields.location,
                image: 'https://firebasestorage.googleapis.com/v0/b/' + bucket.name + '/0/' + encodeURIComponent(file.name) + '?alt=media&token=' + uuid
              })
              .then(() => {
                // send a push message to all clients that a new post was posted
                webpush.setVapidDetails(
                  'mailto:matthias@example.com',
                  'BLXjpE6I0smTQdgFYoqsZOiKTDbL3h3APdsIW22G3ZhkrnON6qetR5sXl8jiiMqNHx9oxqTF5yfKHzxZcgVpRUE',
                  'guuvLunv2Wpg2xOandG5ca8Mc_X0qTk0JlboZ5WHxfg'
                );
                return admin.database().ref('subscriptions').once('value');
              })
              .then((subscriptions) => {
                // send the push messages now
                subscriptions.forEach((sub) => {
                  var pushConfig = {
                    endpoint: sub.val().endpoint,
                    keys: {
                      auth: sub.val().keys.auth,
                      p256dh: sub.val().keys.p256dh
                    }
                  };
                  webpush.sendNotification(pushConfig, JSON.stringify({
                    title: 'New Post',
                    content: 'New Post added!',
                    openUrl: '/help'
                  }));
                });
                return response.status(201).json({
                  message: 'Data stored',
                  id: fields.id
                });
              })
              .catch((err) => {
                response.status(500).json({error: err});
              });
            } else {
              console.log(err);
            }
          }
        );
      });

      // The raw bytes of the upload will be in request.rawBody.  Send it to busboy, and get
      // a callback when it's finished.
      busboy.end(request.rawBody);
      // formData.parse(request, function(err, fields, files) {
      //   fs.rename(files.file.path, "/tmp/" + files.file.name);
      //   var bucket = gcs.bucket("YOUR_PROJECT_ID.appspot.com");
      // });
    });
  });
