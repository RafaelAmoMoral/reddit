import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddPostPage } from './add-post.page';
import { LoginGuard } from 'src/app/guards/login.guard';

const routes: Routes = [
  {
    path: '',
    component: AddPostPage,
    canActivate:[LoginGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddPostPageRoutingModule {}
