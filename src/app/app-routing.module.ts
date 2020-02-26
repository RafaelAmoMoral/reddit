import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LoginGuard } from './guards/login.guard';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule),
    canActivate:[LoginGuard]
  },
  {
    path: 'signup',
    loadChildren: () => import('./pages/authentication/signup/signup.module').then( m => m.SignupPageModule),
    pathMatch: 'full',
    canActivate:[LoginGuard]
  },
  {
    path: 'signin',
    loadChildren: () => import('./pages/authentication/signin/signin.module').then( m => m.SigninPageModule),
    pathMatch: 'full',
    canActivate:[LoginGuard]
  },
  {
    path: 'user',
    loadChildren: () => import('./pages/user/user.module').then( m => m.UserPageModule),
    canActivate:[LoginGuard]
  },
  {
    path: 'post',
    loadChildren: () => import('./pages/post/post.module').then( m => m.PostPageModule),
    canActivate:[LoginGuard]
  },
  {
    path: '**',
    loadChildren: () => import('./pages/error/error.module').then( m => m.ErrorPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
