import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopoverController } from '@ionic/angular';
import { Observable, Subject, Subscription } from 'rxjs';
import { resolve } from 'url';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
  ],
})
export class PopoverManagerModule {

  //pipeConnection:Subject<any>;
  private _enabled: boolean;
  private _popover: HTMLIonPopoverElement;

  constructor(public popoverController: PopoverController) {
  }

  /**
   * Método encargado de presentar un popover en la aplicación.
   * @param ev Este parámetro permite que el popover aparezca en el sitio donde clicamos.
   * @param popoverComponent componente que representa el popover.
   * @param popoverId id del popover, opcional si nuestro popover se encuentra en el top de la aplicación,
   * ya que al hacer dismiss, se elimina el top.
   */
  async presentPopover(ev: any, popoverComponent: any, popoverId?: any): Promise<void> {
    this._popover = await this.popoverController.create({
      event: ev,
      component: popoverComponent,
      id: popoverId
    });
    this._enabled = true;
    return await this._popover.present();
  }

  /*emit(data):void{
    this.pipeConnection.next(data);
    this.pipeConnection.complete();
    this.pipeEnabled=false;
  }*/

  onDismiss(): Promise<any> {
    if (this._enabled) {
      return new Promise((resolve, reject) => {
        this._popover.onDidDismiss()
          .then(data => {
            this._popover = null;
            resolve(data.data);
          })
          .catch(err=>{
            reject(err);
          })
      })
    }
  }

  /*get result():Promise<any>{
    if(this.pipeEnabled)
     return this.pipeConnection.toPromise();
    else
     return new Subject().toPromise();
  }*/
}
