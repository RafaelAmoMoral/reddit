import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { PopoverManagerModule } from 'src/app/modules/popover-manager/popover-manager.module';

@Component({
  selector: 'app-home-list-filter-popover',
  templateUrl: './home-list-filter-popover.component.html',
  styleUrls: ['./home-list-filter-popover.component.scss'],
})
export class HomeListFilterPopoverComponent implements OnInit {

  constructor(private popover: PopoverController) { 
  }

  ngOnInit() {}

  onMostPopularClicked(){
    this.popover.dismiss("nLikes");
  }

  onNewestClicked(){
    this.popover.dismiss("date")
  }


}
