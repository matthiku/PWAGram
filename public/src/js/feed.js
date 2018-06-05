
var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');

var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');

var canvasElem = document.querySelector('#canvas');
var videoPlayer = document.querySelector('#player');
var imagePicker = document.querySelector('#image-picker');
var captureButton = document.querySelector('#capture-btn');
var imagePickerArea = document.querySelector('#pick-image');
var picture;

// progressive way of using device media
function initializeMedia() {
  // create our own polyfill if the browser doesn't support media devices 
  if (!('mediaDevices' in navigator)) {
    navigator.mediaDevices = {};
  }

  // trying to create our own getUserMedia feature
  if (!('getUserMedia' in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      // try to get older implementations of this feature from Safari or Firefox browsers
      var getUserMedia = navigator.webkitGetUserMedia || mozGetUserMedia;
      // still none available - reject this feature promise
      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented'));
      }

      // we have a working getUserMedia function
      return new Promise(function (resolve, reject) {
        // call the function and return it as resolved
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }

  // Capture the image from the video stream when the user clicks on the Capture button
  captureButton.addEventListener('click', function (event) {
    canvasElem.style.display = 'block'; // show the canvas and
    videoPlayer.style.display = 'none'; // hide the live video (but it's still streaming)
    captureButton.style.display = 'none';
    // access the canvas to be able to draw on it
    var context = canvasElem.getContext('2d');
    // capture the current video stream image and draw it to the canvas, and keep the width/height image ratio
    context.drawImage(
      videoPlayer, 0, 0, // source, top, left and height below
      canvasElem.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvasElem.width)
    );
    // now stop the video stream
    videoPlayer.srcObject.getVideoTracks().forEach(function (track) {
      track.stop();
    });
    picture = dataURItoBlob(canvasElem.toDataURL());
  });

  // now we have access to getUserMedia (either natively or as implemented above with a polyfill)
  // at this stage, the browser will show a prompt to the user to allow access to video or audio if that wasn't done yet
  navigator.mediaDevices.getUserMedia({video: true}) // (altern. audio: true)
    .then(function (stream) {
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = 'block';
    })
    .catch(function (error) {
      console.log(error);
      // show the image picker instead if there is no live access to video
      imagePickerArea.style.display = 'block';
    });
}

function openCreatePostModal() {
  // show the modal by sliding it up from bottom of the viewport (100vH) to the top (0vH)
  createPostArea.style.transform = 'translateY(0)';
  initializeMedia();


  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }

  /**
   * DEMO on how to unregister serviceworkers
   */
  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.getRegistrations()
  //   .then(function (registrations) {
  //     for (let i = 0; i < registrations.length; i++) {
  //       registrations[i].unregister();
  //     }
  //   });
  // }
}

function closeCreatePostModal() {
  // make the modal to drop down and out of the viewport
  createPostArea.style.transform = 'translateY(100vH)'; 
  // hide the media stuff
  canvasElem.style.display = 'none';
  videoPlayer.style.display = 'none';
  imagePickerArea.style.display = 'none';
}

// allows to save items on demand
function onSaveButtonClicked(event) {
  console.log('save button clicked!');
  if ('caches' in window){
    caches.open('user-requested')
      .then(function (cache) {
        cache.add('https://httpbin.org/get');
        cache.add('/src/images/sf-boat.jpg');
      });
  }
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

function clearCards() {
  // remove all children from the current list
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url(' + data.image + ')';
  cardTitle.style.backgroundSize = 'cover';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'yellow';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';

  var cardSaveButton = document.createElement('button');
  cardSaveButton.textContent = 'save';
  cardSaveButton.addEventListener('click', onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);

  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  clearCards();
  for (let i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
}

/**
 *  implement the "Cache first, then Web" strategy
 */
var fetchDataUrl = 'https://pwagramma.firebaseio.com/posts.json';
var networkDataReceived = false;

fetch(fetchDataUrl)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    console.log('from Web:', data);
    networkDataReceived = true;
    let dataArray = [];
    for (const key in data) {
      dataArray.push(data[key]);
    }
    updateUI(dataArray);
  });

// we can also check if the indexedDB has the requested data already!
// Then we can have a quick (albeit temporary) result, even when the network is slow or offline!
if ('indexedDB' in window) {
  readAllData('posts')
  .then(function (data) {
    // only use the cached data if we didn't receive the data from the network
    if (!networkDataReceived) {
      console.log('from Cache', data);
      updateUI(data);
    }
  });
}


/**
 * Action triggered by the Submit button of the form - send data to the backend
 */
form.addEventListener('submit', function (event) {
  event.preventDefault();

  // check if the form is filled out
  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    alert('Please fill out all entries');
    return;
  }

  closeCreatePostModal();

  var newPost = {
    id: new Date().toISOString(),
    title: titleInput.value,
    location: locationInput.value,
    image: picture
  };

  // if we have a serviceWorker and a SyncManager, we can defer the 
  // sending of data to the Service Worker, thus enable offline support
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    console.log('tryuing to send sync Event');
    navigator.serviceWorker.ready
      .then(function (sw) {
        console.log('ServiceWorker is ready, sending sync Event');
        // write the data to our indexedDB and then send the Sync Event
        writeData('syncPosts', newPost)
          .then(function () {
            return sw.sync.register('sync-new-post'); // register Sync Event
          })
          .then(function () { // not mandatory, just a little feedback for the user
            var snackbarContainer = document.querySelector('#confirmation-toast');
            var data = {message: 'Your post was saved for syncing'};
            snackbarContainer.MaterialSnackbar.showSnackbar(data);
            createCard(newPost);
          })
          .catch(function (error) {
            console.log(error);
          });
      });
  } else {
    // fallback function if browser doesn't support background syncing
    sendData(backendUrl, newPost)
      .then(function (res) {
        console.log('data was sent to the backend', res);
        // create a new card with that data
        createCard(newPost);
      });
  }
});