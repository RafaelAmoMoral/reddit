import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { createAnimation, Animation } from '@ionic/core';
import { NONE_TYPE } from '@angular/compiler/src/output/output_ast';

@Component({
  selector: 'app-error',
  templateUrl: './error.page.html',
  styleUrls: ['./error.page.scss']
})
export class ErrorPage implements OnInit {
  @ViewChild('rocket', { static: false }) rocket: HTMLIonThumbnailElement;

  constructor() {
  }

  ngOnInit() {
  }

  ionViewDidEnter() {
  }
}


