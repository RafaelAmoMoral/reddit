import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { User } from 'src/app/model/iUser';
import { AuthenticationService } from 'src/app/services/authentication.service';
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
  public passwordTypeInput: string;
  public iconpassword: string;
  public form: FormGroup

  constructor(private formBuilder: FormBuilder, private authentication: AuthenticationService,
    private loader: LoadingManagerModule, private toast: ToastManagerModule,
    private nav: NavController) {
    this.passwordTypeInput = 'password';
    this.iconpassword = 'eye-off';
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
      await this.authentication.login(user);
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

  /**
   * Método para obtener los datos del formulario.
   * @returns varianle de tipo Usuario.
   */
  getUserValues(): User {
    let user = {
      email: this.form.get('email').value,
      password: this.form.get('password').value
    }
    return user;
  }

  /**
   * Método usado en el botón #passwordEye de HTML.
   * Este método es usado para mostrar el yipo de campo de 
   * la contraseña de text a password al igual que el boton que contiene.
   */
  togglePasswordMode() {
    this.passwordTypeInput = this.passwordTypeInput === 'text' ? 'password' : 'text';
    this.iconpassword = this.iconpassword === 'eye-off' ? 'eye' : 'eye-off';
    this.passwordEye.setFocus();
  }


}
