import firebase  from "firebase/app"
import "firebase/storage"


const firebaseConfig = {
    apiKey: "AIzaSyDj-WFEfD8h4_k6tBxW2b5RU8g3jk9uHOM",
    authDomain: "subtitle-8b238.firebaseapp.com",
    databaseURL: "https://subtitle-8b238.firebaseio.com",
    projectId: "subtitle-8b238",
    storageBucket: "subtitle-8b238.appspot.com",
    messagingSenderId: "737343954445",
    appId: "1:737343954445:web:fb850fbaae32822a863f44",
    measurementId: "G-R0675BZ7ZM"
  }; 



  firebase.initializeApp(firebaseConfig)

  const fstorage = firebase.storage();

  export {fstorage ,firebase as default };

