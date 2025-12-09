import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-catalog-page',
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.sass']
})
export class CatalogPage implements OnInit {

  error?: string = undefined;


  constructor() {
  }

  ngOnInit(): void {
  }

}
