const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

exports.storePostData = functions.https.onRequest((request, response) => {
  cors(function (request, response) {
    admin.database().ref('posts').push({
      id: request.body.id,
      title: request.body.title,
      location: request.body.location,
      image: request.body.image
    })
    .then(function () {
      return response.status(201).json({
        message: 'Data stored',
        id: request.body.id
      });
    })
    .catch(function (err) {
      response.status(500).json({error: err});
    });
  });
});