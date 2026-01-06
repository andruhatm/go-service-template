import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { DashboardService, Widget, MetricsQueryRequest } from '../../services/dashboard.service';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface ChartData {
  name: string;
  series: Array<{ name: string; value: number }>;
}

@Component({
  selector: 'app-chart-widget',
  templateUrl: './chart-widget.component.html',
  styleUrls: ['./chart-widget.component.css']
})
export class ChartWidgetComponent implements OnInit, OnDestroy {
  @Input() widget!: Widget;
  @Input() period: number = 3600; // Default 1 hour in seconds
  @Input() autoRefresh: boolean = false;
  @Input() refreshInterval: number = 60000; // 60 seconds
  @Output() removeWidget = new EventEmitter<Widget>();

  chartData: ChartData[] = [];
  loading = true;
  error: string | null = null;
  
  // Chart options
  view: [number, number] = [600, 300];
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  showXAxisLabel = true;
  xAxisLabel = 'Время';
  showYAxisLabel = true;
  yAxisLabel = 'Значение';
  timeline = true;
  colorScheme = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };

  private refreshSubscription?: Subscription;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadData();
    
    if (this.autoRefresh) {
      this.startAutoRefresh();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.refreshSubscription = interval(this.refreshInterval)
      .pipe(
        switchMap(() => {
          return this.queryMetrics();
        })
      )
      .subscribe({
        next: (response) => {
          this.processMetricsData(response);
        },
        error: (error) => {
          console.error('Auto-refresh error:', error);
        }
      });
  }

  stopAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    this.queryMetrics().subscribe({
      next: (response) => {
        this.processMetricsData(response);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading metrics:', error);
        this.error = 'Не удалось загрузить данные метрик';
        this.loading = false;
      }
    });
  }

  private queryMetrics() {
    const now = Math.floor(Date.now() / 1000);
    const request: MetricsQueryRequest = {
      metricName: this.widget.metricName,
      objectName: this.widget.objectName,
      startTime: now - this.period,
      endTime: now,
      step: Math.max(Math.floor(this.period / 100), 60) // Adaptive step
    };

    return this.dashboardService.queryMetrics(request);
  }

  private processMetricsData(response: any): void {
    if (response.status === 'success' && response.data && response.data.result) {
      const chartData: ChartData[] = [];

      response.data.result.forEach((result: any) => {
        const seriesName = result.metric.type || 'value';
        const series: Array<{ name: string; value: number }> = [];

        if (result.values && Array.isArray(result.values)) {
          result.values.forEach((point: [number, string]) => {
            const timestamp = point[0] * 1000; // Convert to milliseconds
            const value = parseFloat(point[1]);
            series.push({
              name: new Date(timestamp).toLocaleTimeString('ru-RU'),
              value: value
            });
          });
        }

        chartData.push({
          name: seriesName,
          series: series
        });
      });

      this.chartData = chartData;
    } else {
      this.error = response.error || 'Нет данных';
    }
  }

  refresh(): void {
    this.loadData();
  }

  remove(): void {
    this.removeWidget.emit(this.widget);
  }
}

