/* jshint esversion: 6 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
var webpush = require('web-push');

// Create and Deploy Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

// see https://console.firebase.google.com/u/0/project/pwagramma/settings/serviceaccounts/adminsdk
var serviceAccount = require('./pwagramma-firebase-key.json');

admin.initializeApp({
  // where is the DB
  databaseURL: 'https://pwagramma.firebaseio.com/',
  // key file
  credential: admin.credential.cert(serviceAccount)
});

exports.storePostData = functions.https.onRequest(
  (request, response) => {
    cors(
      request,
      response,
      () => {
        // write the new post to the database
        admin.database().ref('posts').push({
          id: request.body.id,
          title: request.body.title,
          location: request.body.location,
          image: request.body.image
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
            id: request.body.id
          });
        })
        .catch((err) => {
          response.status(500).json({error: err});
        });
      });
  }
);
