import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-main-page',
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.sass']
})
export class MainPage implements OnInit {

  error?: string = undefined;


  constructor() {
  }

  ngOnInit(): void {
  }

}
