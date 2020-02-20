import { Component, OnInit } from '@angular/core';
import { NavController, PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-home-login-popover',
  templateUrl: './home-login-popover.component.html',
  styleUrls: ['./home-login-popover.component.scss'],
})
export class HomeLoginPopoverComponent implements OnInit {

  constructor(private nav: NavController, private popover: PopoverController ) { }

  ngOnInit() {}

  redirectToLogIn(){
    this.popover.dismiss();
    this.nav.navigateForward('signin');
  }

  redirectToLogUp(){
    this.popover.dismiss();
    this.nav.navigateForward('signup');
  }

}
