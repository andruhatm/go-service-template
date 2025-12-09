import {Component, OnInit, ViewChild} from '@angular/core';
import {DatePipe} from "@angular/common";
import {CurrentUserImpl} from "../../../../core/auth/current-user.service";
import {MatDialog} from "@angular/material/dialog";
import {ExistingEvent} from "../../../../features/events/models/existing-event.model";
import {DefaultOrganizer} from "../../../../features/users/models/default-organizer.model";
import {HttpClient} from '@angular/common/http';
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {Anomaly} from "../../../../features/other-model/anomalies.model";
import {ForecastDialogComponent} from "../add-forecast-req/forecast-dialog.component";
import {AnomalyService} from "../../../../features/form/services/anomaly.service";

@Component({
  selector: 'app-anomaly-list',
  templateUrl: './anomaly-list.component.html',
  styleUrls: ['./anomaly-list.component.css']
})
export class AnomalyListComponent implements OnInit {

  columns = [
    {
      columnDef: 'name',
      header: 'Метрика',
      cell: (element: Anomaly) => `${element.name}`,
    },
    {
      columnDef: 'status',
      header: 'Статус',
      cell: (element: Anomaly) => `${element.status}`,
    },
    {
      columnDef: 'objName',
      header: 'Имя обьекта',
      cell: (element: Anomaly) => `${element.objectName}`,
    },
    {
      columnDef: 'objType',
      header: 'Тип обьекта',
      cell: (element: Anomaly) => `${element.objectType}`,
    },
    {
      columnDef: 'DateOfCreation',
      header: 'Дата создания',
      cell: (element: Anomaly) => `${element.dateAdded}`,
    },
    {
      columnDef: 'DateOfForecast',
      header: 'Дата пересечения',
      cell: (element: Anomaly) => `${element.calculatedDate}`,
    },
  ];

  constructor(
    public readonly datepipe: DatePipe,
    public dialog: MatDialog,
    private http: HttpClient,
    private readonly anomalyService: AnomalyService,
  ) {

  }

  dataSource = new MatTableDataSource<Anomaly>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  displayedColumns = this.columns.map(c => c.columnDef);

  events: ExistingEvent[];
  user: CurrentUserImpl;
  date: Date;
  defaultOganizer: DefaultOrganizer;

  currentTutorial = null;
  currentIndex = -1;
  pagesCount: number;
  title = '';
  modal = false;

  dateSort = true;
  rateSort;
  membersSort;

  dateIcon = 'expand_more';
  membersIcon;
  rateIcon;

  userCity;

  loading = false;

  page = 1;
  count = 0;
  pageSize = 15;
  query = 'empty';


  isEmptyResponse = false;

  ngOnInit(): void {
    this.anomalyService.anomalies$.subscribe(anomalies => this.dataSource.data = anomalies);
    this.anomalyService.getAnomalies();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  openDialog() {
    const dialogRef = this.dialog.open(ForecastDialogComponent, {
      width: '550px',
      // data: {name: this.name, animal: this.animal},
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }
}


function randomDate(date: Date): string{
  const datePipe = new DatePipe('en-US');
  return datePipe.transform(date, 'yyyy-MM-dd HH:mm')

}
