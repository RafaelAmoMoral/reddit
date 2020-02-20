import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HomePageRoutingModule } from './home-routing.module';

import { HomePage } from './home.page';
import { PopoverManagerModule } from 'src/app/modules/popover-manager/popover-manager.module';
import { ComponentsModule } from 'src/app/components/components.module';
import { HomeUserPopoverComponent } from 'src/app/components/popovers/home-user-popover/home-user-popover.component';
import { HomeListFilterPopoverComponent } from 'src/app/components/popovers/home-list-filter/home-list-filter-popover.component';
import { HomeLoginPopoverComponent } from 'src/app/components/popovers/home-login-popover/home-login-popover.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ComponentsModule,
    HomePageRoutingModule,
    PopoverManagerModule,
  ],
  declarations: [HomePage],
  entryComponents: [HomeUserPopoverComponent, HomeListFilterPopoverComponent, HomeLoginPopoverComponent]
})
export class HomePageModule {}
