import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { User } from 'src/app/model/iUser';
import { AuthenticationService } from 'src/app/services/authentication.service';
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
  public passwordTypeInput: string;
  public iconpassword: string;
  public form: FormGroup

  constructor(private formBuilder: FormBuilder, private authentication: AuthenticationService,
    private nav: NavController, private loader: LoadingManagerModule,
    private toast: ToastManagerModule) {
    this.passwordTypeInput = 'password';
    this.iconpassword = 'eye-off';
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
    let user = this.getUserValues();
    if (user) {
      this.authentication.signUp(user)
        .then(() => {
          this.loader.hide();
          this.nav.navigateForward('/home');
        })
        .catch((err) => {
          this.loader.hide();
          this.toast.show(err);
        })
    }
  }

  /**
  * Método para obtener los datos del formulario.
  * @returns varianle de tipo Usuario.
  */
  getUserValues(): User {
    let user = {
      name:  this.form.get('name').value,
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


