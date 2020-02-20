// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "AIzaSyAZfVNW2JPHnwt-sVdc78Lcbs5FRdYQ41A",
    authDomain: "reddit-be894.firebaseapp.com",
    databaseURL: "https://reddit-be894.firebaseio.com",
    projectId: "reddit-be894",
    storageBucket: "reddit-be894.appspot.com",
    messagingSenderId: "768273020903",
    appId: "1:768273020903:web:dac00a98142c65262a2f42",
    measurementId: "G-ZF9ZGSH12J",
  },
  postCollection: 'post',
  userCollection: 'user'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
