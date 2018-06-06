module.exports = {
  "globDirectory": "public/",
  "globPatterns": [
    "**/*.{html,ico,json,css,js}",
    "src/images/*.{png,jpg}"  // only files directly in the images folder
  ],
  "globIgnores": [
    "help/**"
  ],
  "swSrc": "public/sw-base.js",
  "swDest": "public/service-worker.js"
};