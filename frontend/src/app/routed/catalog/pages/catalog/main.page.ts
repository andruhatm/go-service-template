import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-catalog-page',
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.css']
})
export class CatalogPage implements OnInit {

  error?: string = undefined;


  constructor() {
  }

  ngOnInit(): void {
  }

}
