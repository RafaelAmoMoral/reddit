import { Component, OnInit } from '@angular/core';
import { NavController, PopoverController } from '@ionic/angular';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { LoadingManagerModule } from 'src/app/modules/loading-manager/loading-manager.module';
import { ToastManagerModule } from 'src/app/modules/toast-manager/toast-manager.module';

@Component({
  selector: 'app-home-user-popover',
  templateUrl: './home-user-popover.component.html',
  styleUrls: ['./home-user-popover.component.scss'],
})
export class HomeUserPopoverComponent implements OnInit {

  constructor(private nav: NavController, private popover: PopoverController,
    private authentication: AuthenticationService, private toast: ToastManagerModule) { }

  ngOnInit() { }

  redirectToUserProfile() {
    this.popover.dismiss();
    this.nav.navigateForward('user');
  }

  async logOut() {
    this.popover.dismiss(true);
  }

}
