import {Component, OnInit, OnDestroy, ViewChild} from '@angular/core';
import {DatePipe} from "@angular/common";
import {MatDialog} from "@angular/material/dialog";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Router} from "@angular/router";
import {Subscription} from "rxjs";
import {ForecastDialogComponent} from "../add-forecast-req/forecast-dialog.component";
import {ForecastService, Forecast} from "../../../../services/forecast.service";
import {NotificationService} from "../../../../core/services/notification.service";
import {Notification, NotificationType} from "../../../../core/models/notification.model";

@Component({
  selector: 'app-anomaly-list',
  templateUrl: './anomaly-list.component.html',
  styleUrls: ['./anomaly-list.component.css', './notification-styles.scss']
})
export class AnomalyListComponent implements OnInit, OnDestroy {

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

  dataSource = new MatTableDataSource<Forecast>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  displayedColumns = this.columns.map(c => c.columnDef);
  loading = false;
  isEmptyResponse = false;

  // Notifications
  private notificationSubscription?: Subscription;
  private lastNotificationId?: string;
  private shownNotificationIds = new Set<string>();

  constructor(
    public readonly datepipe: DatePipe,
    public dialog: MatDialog,
    public readonly forecastService: ForecastService,
    private router: Router,
    private notificationService: NotificationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadForecasts();
    this.initNotifications();
  }

  ngOnDestroy(): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  initNotifications(): void {
    // Start polling for notifications (every 30 seconds)
    this.notificationSubscription = this.notificationService
      .pollNotifications(30000)
      .subscribe(response => {
        if (response.notifications && response.notifications.length > 0) {
          // Show only new unread notifications
          response.notifications.forEach(notification => {
            if (!this.shownNotificationIds.has(notification.id)) {
              this.shownNotificationIds.add(notification.id);
              this.showNotificationToast(notification);
            }
          });
        }
      });
  }

  showNotificationToast(notification: Notification): void {
    const config = this.getSnackBarConfig(notification.type);
    
    const snackBarRef = this.snackBar.open(
      notification.message,
      'Просмотр',
      {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        ...config
      }
    );

    snackBarRef.onAction().subscribe(() => {
      // Mark as read
      this.notificationService.markAsRead(notification.id).subscribe();
      
      // Navigate to related forecast if available
      if (notification.related_type === 'forecast' && notification.related_id) {
        this.router.navigate(['/anomaly', notification.related_id]);
      }
    });
  }

  getSnackBarConfig(type: NotificationType): any {
    switch (type) {
      case NotificationType.FORECAST_COMPLETED:
        return {
          panelClass: ['notification-success'],
          duration: 6000
        };
      case NotificationType.FORECAST_FAILED:
        return {
          panelClass: ['notification-error'],
          duration: 8000
        };
      case NotificationType.FORECAST_CREATED:
        return {
          panelClass: ['notification-info'],
          duration: 4000
        };
      case NotificationType.FORECAST_PROCESSING:
        return {
          panelClass: ['notification-info'],
          duration: 4000
        };
      default:
        return {
          panelClass: ['notification-default'],
          duration: 5000
        };
    }
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
        
        // Refresh notifications immediately to show the creation notification
        this.notificationService.refreshUnreadCount();
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

  viewForecast(forecast: Forecast): void {
    this.router.navigate(['/anomaly', forecast.id]);
  }
}
