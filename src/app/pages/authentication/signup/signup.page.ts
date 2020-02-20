import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { User } from 'src/app/model/iUser';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { NavController, IonInput } from '@ionic/angular';
import { LoadingManagerModule } from 'src/app/modules/loading-manager/loading-manager.module';
import { ToastManagerModule } from 'src/app/modules/toast-manager/toast-manager.module';
@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage implements OnInit {
  @ViewChild('passwordEyeRegister', { static: false }) passwordEye: IonInput;
  passwordTypeInput = 'password';
  iconpassword = 'eye-off';

  public form: FormGroup
  private user: User;

  constructor(private formBuilder: FormBuilder, private authentication: AuthenticationService,
    private nav: NavController, private loader: LoadingManagerModule,
    private toast: ToastManagerModule) {
    this.user = {
      email: ''
    }
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', Validators.required],
      password: ['', Validators.minLength(6)]
    })
  }

  async signUp() {
    await this.loader.presentLoading();
    this.user = {
      name: this.form.get('name').value,
      email: this.form.get('email').value,
      password: this.form.get('password').value
    }
    this.authentication.signUp(this.user)
      .then((data) => {
        this.loader.hide();
        this.nav.navigateForward('/home');
      })
      .catch((err) => {
        this.loader.hide();
        this.toast.show(err);
      })
  }

  togglePasswordMode() {
    this.passwordTypeInput = this.passwordTypeInput === 'text' ? 'password' : 'text';
    this.iconpassword = this.iconpassword === 'eye-off' ? 'eye' : 'eye-off';
    this.passwordEye.setFocus();
  }

}


