import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UserPage } from './user.page';
import { LoginGuard } from 'src/app/guards/login.guard';

const routes: Routes = [
  {
    path: '',
    component: UserPage
  },
  {
    path: 'edit-user',
    loadChildren: () => import('./edit-user/edit-user.module').then(m => m.EditUserPageModule),
    canActivate: [LoginGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserPageRoutingModule { }
