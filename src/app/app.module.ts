import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { GooglePlus } from '@ionic-native/google-plus/ngx';
import { AuthenticationService } from './services/authentication/authentication.service';
import { AngularFireModule, FirebaseOptionsToken } from 'angularfire2';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { environment } from 'src/environments/environment';

import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { LoadingManagerModule } from './modules/loading-manager/loading-manager.module';
import { ToastManagerModule } from './modules/toast-manager/toast-manager.module';
import { Facebook,FacebookLoginResponse } from '@ionic-native/facebook/ngx';
import { PostService } from './services/post.service';
import { AngularFireStorageModule } from 'angularfire2/storage';

import { Camera as CameraCV } from '@ionic-native/camera/ngx';
import { UserService } from './services/user.service';
import { MediaCapture } from '@ionic-native/media-capture/ngx';
import { File } from '@ionic-native/file/ngx';
import { VideoEditor } from '@ionic-native/video-editor/ngx';


@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireStorageModule,
    LoadingManagerModule,
    ToastManagerModule,
  ],
  providers: [
    VideoEditor,
    File,
    MediaCapture,
    CameraCV,
    StatusBar,
    SplashScreen,
    GooglePlus,
    Facebook,
    NativeStorage,
    PostService,
    AuthenticationService,
    UserService,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
