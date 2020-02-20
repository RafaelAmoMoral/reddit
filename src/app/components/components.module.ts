import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeUserPopoverComponent } from './popovers/home-user-popover/home-user-popover.component';
import { IonicModule } from '@ionic/angular';
import { HomeListFilterPopoverComponent } from './popovers/home-list-filter/home-list-filter-popover.component';
import { HomeLoginPopoverComponent } from './popovers/home-login-popover/home-login-popover.component';


/**
 * Se ha de importar el modulo de ionic ya que sino no detecta los ion tags.
 */
@NgModule({
  declarations: [HomeUserPopoverComponent, HomeListFilterPopoverComponent, HomeLoginPopoverComponent],
  exports: [HomeUserPopoverComponent, HomeListFilterPopoverComponent, HomeLoginPopoverComponent],
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class ComponentsModule { }
