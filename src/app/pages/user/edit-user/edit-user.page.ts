import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/model/iUser';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { SafeResourceUrl } from '@angular/platform-browser';
import { FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { LoadingManagerModule } from 'src/app/modules/loading-manager/loading-manager.module';
import { ToastManagerModule } from 'src/app/modules/toast-manager/toast-manager.module';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.page.html',
  styleUrls: ['./edit-user.page.scss'],
})
export class EditUserPage implements OnInit {

  public user: User;
  public userForm: FormGroup;
  public securityForm: FormGroup;


  constructor(private authService: AuthenticationService, private formBuilder: FormBuilder,
    private userService: UserService, private loader: LoadingManagerModule,
    private toast: ToastManagerModule) {
    this.user = this.authService.getAuthenticatedUser();
  }

  ngOnInit() {
    this.securityForm = this.formBuilder.group({
      email: new FormControl({ value: this.user.email || '', disabled: true }, Validators.required),
      password:new FormControl({ value: this.user.password || '', disabled: true }, Validators.required)
    })
    this.userForm = this.formBuilder.group({
      description: [this.user.description || '', Validators.required],
      phone: [this.user.phone || '', Validators.required],
    })
  }

  /**
   * Modifica al usuario con los valores del formulario.
   */
  setUserValues() {
    this.user.description = this.userForm.get('description').value;
    this.user.phone = this.userForm.get('phone').value;
  }

  /**
   * Guarda al usuario en la base de datos.
   */
  async saveUserChanges() {
    await this.loader.presentLoading();
    this.setUserValues();
    try {
      await this.userService.updateUser(this.user);
      this.toast.show('¡Usuario actualizado!')
    } catch (err) {
      this.toast.show(err);
    } finally {
      await this.loader.hide();
    }
  }

}
