import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { PopoverManagerModule } from 'src/app/modules/popover-manager/popover-manager.module';

@Component({
  selector: 'app-home-list-filter-popover',
  templateUrl: './home-list-filter-popover.component.html',
  styleUrls: ['./home-list-filter-popover.component.scss'],
})
export class HomeListFilterPopoverComponent implements OnInit {

  private static _filterType:string ='Popular';

  constructor(private popover: PopoverController) { 
  }

  ngOnInit() {}

  onMostPopularClicked(){
    this.popover.dismiss("Popular");
    this.filterType='Popular';
  }

  onNewestClicked(){
    this.popover.dismiss("Recientes");
    this.filterType='Recientes';
  }

  set filterType(value:string){
    HomeListFilterPopoverComponent._filterType=value;
  }

  get filterType(){
    return HomeListFilterPopoverComponent._filterType;
  }


}
