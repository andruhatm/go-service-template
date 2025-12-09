import {Component, Inject, OnInit} from '@angular/core';
import {EventCategory} from '../../../../features/other-model/category.model';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {FormBuilder, FormGroup} from "@angular/forms";


export interface Ran1 {
  name: string;
  type?: string[];
  unit?: string;
  valuetype: string;
  aggregation: string;
}

export interface Ran2 {
  name: string;
  type?: string[];
  unit?: string;
  valuetype: string;
  degradation: string;
  threshold: string;
}

const ELEMENT_DATA: Ran1[] = []

const ELEMENT_DATA2: Ran2[] = []

@Component({
  selector: 'app-metric-catalog',
  templateUrl: './metric-catalog.component.html',
  styleUrls: ['./metric-catalog.component.css']
})
export class MetricCatalogComponent implements OnInit {

  constructor(public dialog: MatDialog) { }

  metric = true;

  columns = [
    {
      columnDef: 'name',
      header: 'Имя',
      cell: (element: Ran1) => `${element.name}`,
    },
    {
      columnDef: 'type',
      header: 'Тип',
      cell: (element: Ran1) => `${element.type}`,
    },
    {
      columnDef: 'unit',
      header: 'Единица измерения',
      cell: (element: Ran1) => `${element.unit}`,
    },
    {
      columnDef: 'aggregation',
      header: 'Тип агрегации',
      cell: (element: Ran1) => `${element.aggregation}`,
    },
    {
      columnDef: 'valuetype',
      header: 'Исчисление',
      cell: (element: Ran1) => `${element.valuetype}`,
    },

  ];
  columns2 = [
    {
      columnDef: 'name',
      header: 'Имя',
      cell: (element: Ran2) => `${element.name}`,
    },
    {
      columnDef: 'type',
      header: 'Тип',
      cell: (element: Ran2) => `${element.type}`,
    },
    {
      columnDef: 'unit',
      header: 'Единица измерения',
      cell: (element: Ran2) => `${element.unit}`,
    },
    {
      columnDef: 'valuetype',
      header: 'Исчисление',
      cell: (element: Ran2) => `${element.valuetype}`,
    },
    {
      columnDef: 'degradation',
      header: 'Направление ухудшения',
      cell: (element: Ran2) => `${element.degradation}`,
    },
    {
      columnDef: 'threshold',
      header: 'Ограничитель',
      cell: (element: Ran2) => `${element.threshold}`,
    },
  ];

  dataSource = ELEMENT_DATA;
  dataSource2 = ELEMENT_DATA2;
  displayedColumns = this.columns.map(c => c.columnDef);
  displayedColumns2 = this.columns2.map(c => c.columnDef);

  categories: EventCategory[];

  ngOnInit(): void {
    console.log('MetricCatalogComponent');
    this.categories = [
      {nameCategory: 'Метрики',color:'#f5fd1c' },
      {nameCategory: 'КПИ',color:'#1282f8' },

    ];
  }

  handleCategoryClick(item: EventCategory): void {
    console.log(item);
    this.metric = false;
  }

  openDialog() {
    const dialogRef = this.dialog.open(KpiDialogComponent, {
      width: '550px',
      // data: {name: this.name, animal: this.animal},
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }
}

@Component({
  selector: 'app-kpi-dialog',
  styleUrls: ['./metric-catalog.component.css'],
  templateUrl: './dialog.component.html',
})
export class KpiDialogComponent implements OnInit{
  constructor(
    public dialogRef: MatDialogRef<KpiDialogComponent>,
    private readonly fb: FormBuilder,
    // @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {}

  form: FormGroup;

  ngOnInit() {
    this.form = this.initForm();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  handleFormSubmit(): void {
    const value = this.form.value;

    console.log(value);
    // console.log(this.form.value.chipsControl);


    // TODO add files
    // this.eventService
    //   .createEvent(value.date, value.place, value.name, value.description, value.city.cityUuidId, value.chipsControl,
    //     this.public_id, this.avatar_person, this.height, this.width, this.secure_url)
    //   .subscribe(
    //     (data ) => {
    //       console.log('event creation success');
    //       this.router.navigate(['/event', data.eventId]);
    //     },
    //     (error: HttpErrorResponse) => {
    //       // console.log('event creation error');
    //       console.log(error);
    //       console.log('event creation success');
    //     }
    //   );
    console.log(this.form.value);
  }

  // tslint:disable-next-line:typedef
  private initForm() {
    return this.fb.group({
      name: this.fb.control(''),
      type: this.fb.control(''),
      valuetype: this.fb.control(''),
      unit: this.fb.control(''),
      degradation: this.fb.control(''),
      threshold: this.fb.control(''),
      formula: this.fb.control(''),
      // date: this.fb.control(''),
      // time: this.fb.control(''),
      // dateTime: this.fb.control('')
    });
    return undefined;
  }
}
