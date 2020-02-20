import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { User } from 'src/app/model/iUser';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { LoadingManagerModule } from 'src/app/modules/loading-manager/loading-manager.module';
import { ToastManagerModule } from 'src/app/modules/toast-manager/toast-manager.module';
import { NavController, IonInput } from '@ionic/angular';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
})
export class SigninPage implements OnInit {

  @ViewChild('passwordEyeRegister', { static: false }) passwordEye: IonInput;
  passwordTypeInput = 'password';
  iconpassword = 'eye-off';

  public form: FormGroup
  private user: User;

  constructor(private formBuilder: FormBuilder, private authentication: AuthenticationService,
    private loader: LoadingManagerModule, private toast: ToastManagerModule,
    private nav: NavController) {
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    })
  }

  async login() {
    await this.loader.presentLoading();
    let user: User = this.getUserValues();
    try {
      let databaseUser = await this.authentication.login(user);
      this.loader.hide()
        .then(() => {
          this.nav.navigateForward('/home')
        })
        .catch(() => { })
    } catch (err) {
      this.loader.hide()
      this.toast.show(err);
    }
  }

  loginGoogle() {
    this.getUserValues();
    this.authentication.loginGoogle()
      .then((data) => { console.log(data) })
      .catch((err) => { console.log(err) })
  }

  loginFacebook() {
    this.getUserValues();
    this.authentication.loginFacebook();
  }

  getUserValues(): User {
    let user = {
      email: this.form.get('email').value,
      password: this.form.get('password').value
    }
    return user;
  }

  togglePasswordMode() {
    this.passwordTypeInput = this.passwordTypeInput === 'text' ? 'password' : 'text';
    this.iconpassword = this.iconpassword === 'eye-off' ? 'eye' : 'eye-off';
    this.passwordEye.setFocus();
  }


}
