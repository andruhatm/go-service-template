import {Component, OnInit, ViewChild} from '@angular/core';
import {DatePipe} from "@angular/common";
import {MatDialog} from "@angular/material/dialog";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {ForecastDialogComponent} from "../add-forecast-req/forecast-dialog.component";
import {ForecastService, Forecast} from "../../../../services/forecast.service";

@Component({
  selector: 'app-anomaly-list',
  templateUrl: './anomaly-list.component.html',
  styleUrls: ['./anomaly-list.component.css']
})
export class AnomalyListComponent implements OnInit {

  columns = [
    {
      columnDef: 'metric_name',
      header: 'Метрика',
      cell: (element: Forecast) => `${element.metric_name}`,
    },
    {
      columnDef: 'mon_object_name',
      header: 'Объект мониторинга',
      cell: (element: Forecast) => `${element.mon_object_name}`,
    },
    {
      columnDef: 'status',
      header: 'Статус',
      cell: (element: Forecast) => `${element.status}`,
    },
    {
      columnDef: 'forecast_periods',
      header: 'Периоды',
      cell: (element: Forecast) => `${element.forecast_periods} (${element.freq})`,
    },
    {
      columnDef: 'created_at',
      header: 'Дата создания',
      cell: (element: Forecast) => this.formatDate(element.created_at),
    },
    {
      columnDef: 'forecast_points',
      header: 'Точек прогноза',
      cell: (element: Forecast) => element.forecast_points ? `${element.forecast_points}` : '-',
    },
    {
      columnDef: 'actions',
      header: 'Действия',
      cell: () => '',
    },
  ];

  constructor(
    public readonly datepipe: DatePipe,
    public dialog: MatDialog,
    public readonly forecastService: ForecastService,
  ) {}

  dataSource = new MatTableDataSource<Forecast>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  displayedColumns = this.columns.map(c => c.columnDef);
  loading = false;
  isEmptyResponse = false;

  ngOnInit(): void {
    this.loadForecasts();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadForecasts(): void {
    this.loading = true;
    this.forecastService.listForecasts(100, 0).subscribe({
      next: (response) => {
        this.dataSource.data = response.forecasts;
        this.loading = false;
        this.isEmptyResponse = response.forecasts.length === 0;
      },
      error: (err) => {
        console.error('Failed to load forecasts:', err);
        this.loading = false;
      }
    });
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(ForecastDialogComponent, {
      width: '750px',
      maxWidth: '90vw',
      panelClass: 'forecast-dialog-panel',
      autoFocus: false,
      restoreFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Forecast created:', result);
        this.loadForecasts(); // Reload the list
      }
    });
  }

  deleteForecast(forecast: Forecast): void {
    if (confirm(`Удалить прогноз для ${forecast.metric_name}?`)) {
      this.forecastService.deleteForecast(forecast.id).subscribe({
        next: () => {
          console.log('Forecast deleted');
          this.loadForecasts();
        },
        error: (err) => {
          console.error('Failed to delete forecast:', err);
          alert('Ошибка при удалении прогноза');
        }
      });
    }
  }

  getStatusColor(status: string): string {
    return this.forecastService.getStatusColor(status);
  }

  getStatusIcon(status: string): string {
    return this.forecastService.getStatusIcon(status);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return this.datepipe.transform(date, 'dd.MM.yyyy HH:mm') || '';
  }

  refreshForecasts(): void {
    this.loadForecasts();
  }
}
