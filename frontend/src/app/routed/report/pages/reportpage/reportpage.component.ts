import {Component, OnInit} from '@angular/core';
import {EventCategory} from "../../../../features/other-model/category.model";
import {AgChartOptions} from 'ag-charts-community';
import {getData} from "./data";
import {FormBuilder, FormControl, FormGroup} from "@angular/forms";
import {delay} from "rxjs/operators";

@Component({
  selector: 'app-reportpage',
  templateUrl: './reportpage.component.html',
  styleUrls: ['./reportpage.component.css']
})
export class ReportpageComponent implements OnInit {

  public options: AgChartOptions;

  constructor(private readonly fb: FormBuilder) {
    this.options = {
      autoSize: true,
      data: getData(),
      title: {
        text: 'Результат',
      },
      // subtitle: {
      //   text: '2008-2020',
      // },
      series: [
        {
          xKey: 'year',
          yKey: 'visitors',
          yName: 'RRCConnEstabSucc0'
        },
        {
          xKey: 'year',
          yKey: 'visitors1',
          yName: 'RRCSetupSuccessRate'
        },
      ],
      legend: {
        enabled: true,
      },
    };
  }

  metric = true;
  report = false;

  form: FormGroup;
  minDate = new Date(Date.now());
  categories: EventCategory[];
  // metrics1 = new FormControl('');

  cellList: string[]
  neList: string[]
  networkList: string[]

  metricList: string[]
  // kpis = new FormControl('');
  kpiList: string[]
  granularity: string[] = ['15m', '1h', '1d'];
  public currentCategory = 1;

  handleCategoryClick(item: EventCategory): void {
    console.log(item);
    this.currentCategory = item.num;
  }

  ngOnInit(): void {
    console.log('MetricCatalogComponent');
    this.categories = [
      {nameCategory: 'Соты', color: '#f5fd1c', num: 1},
      {nameCategory: 'Узлы связи', color: '#1282f8', num: 2},
      {nameCategory: 'Подсеть', color: '#1282f8', num: 3},

    ];
    this.form = this.initForm();
  }

  handleFormSubmit() {
    delay(3000);
    this.report = true;
  }

  private initForm() {
    return this.fb.group({
      metrics1: this.fb.control(''),
      kpis: this.fb.control(''),
      date: this.fb.control(''),
      time: this.fb.control(''),
      date2: this.fb.control(''),
      time2: this.fb.control(''),
    });

  }
}
