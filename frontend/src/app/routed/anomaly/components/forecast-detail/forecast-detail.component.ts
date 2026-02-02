import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ForecastService, Forecast} from '../../../../services/forecast.service';
import {MetricsQueryService} from '../../../../services/metrics-query.service';

interface ForecastDataPoint {
  timestamp: number;
  value: number;
  type: 'historical' | 'forecast' | 'threshold';
}

@Component({
  selector: 'app-forecast-detail',
  templateUrl: './forecast-detail.component.html',
  styleUrls: ['./forecast-detail.component.css']
})
export class ForecastDetailComponent implements OnInit {
  forecastId: string;
  forecast: Forecast;
  loading = true;
  error: string = null;

  // Chart data
  chartData: any[] = [];
  colorScheme = {
    domain: ['#5AA454', '#E44D25', '#FFA500']
  };

  // Chart configuration
  view: [number, number] = [1200, 500];
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  showXAxisLabel = true;
  xAxisLabel = 'Время';
  showYAxisLabel = true;
  yAxisLabel = 'Значение';
  timeline = true;
  autoScale = true;
  animations = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forecastService: ForecastService,
    private metricsQueryService: MetricsQueryService
  ) {}

  ngOnInit(): void {
    this.forecastId = this.route.snapshot.paramMap.get('id');
    if (this.forecastId) {
      this.loadForecastDetail();
    } else {
      this.error = 'ID прогноза не указан';
      this.loading = false;
    }
  }

  loadForecastDetail(): void {
    this.loading = true;
    this.error = null;

    // Load forecast metadata
    this.forecastService.getForecast(this.forecastId).subscribe({
      next: (forecast) => {
        this.forecast = forecast;

        if (forecast.status === 'completed') {
          this.loadForecastData();
        } else {
          this.error = `Прогноз в статусе "${forecast.status}". Данные для отображения недоступны.`;
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Failed to load forecast:', err);
        this.error = 'Ошибка при загрузке прогноза';
        this.loading = false;
      }
    });
  }

  loadForecastData(): void {
    const endTimestamp = Math.floor(Date.now() / 1000);

    // Load historical data
    this.metricsQueryService.queryMetrics(
      this.forecast.metric_name,
      this.forecast.mon_object_name,
      this.forecast.from_timestamp,
      endTimestamp,
      this.forecast.step || '1h'
    ).subscribe({
      next: (historicalData) => {
        // Load forecast data
        const forecastStartTimestamp = this.forecast.forecast_start_date 
          ? Math.floor(new Date(this.forecast.forecast_start_date).getTime() / 1000)
          : endTimestamp;
        const forecastEndTimestamp = this.forecast.forecast_end_date
          ? Math.floor(new Date(this.forecast.forecast_end_date).getTime() / 1000)
          : endTimestamp + 86400 * 30; // fallback: 30 days

        this.metricsQueryService.queryMetrics(
          this.forecast.metric_name,
          this.forecast.mon_object_name,
          forecastStartTimestamp,
          forecastEndTimestamp,
          this.forecast.step || '1h',
          'forecast',
          this.forecastId
        ).subscribe({
          next: (forecastData) => {
            this.prepareChartData(historicalData, forecastData);
            this.loading = false;
          },
          error: (err) => {
            console.error('Failed to load forecast data:', err);
            this.error = 'Ошибка при загрузке данных прогноза';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Failed to load historical data:', err);
        this.error = 'Ошибка при загрузке исторических данных';
        this.loading = false;
      }
    });
  }

  prepareChartData(historicalData: any[], forecastData: any[]): void {
    // Prepare historical data series
    const historicalSeries = {
      name: 'Исторические данные',
      series: historicalData.map(point => ({
        name: new Date(point.timestamp * 1000),
        value: point.value
      }))
    };

    // Prepare forecast data series
    const forecastSeries = {
      name: 'Прогноз',
      series: forecastData.map(point => ({
        name: new Date(point.timestamp * 1000),
        value: point.value
      }))
    };

    // TODO: Add threshold line if available
    // For now, we'll just use historical and forecast data
    this.chartData = [historicalSeries, forecastSeries];
  }

  goBack(): void {
    this.router.navigate(['/anomaly']);
  }

  getStatusColor(status: string): string {
    return this.forecastService.getStatusColor(status);
  }

  getStatusIcon(status: string): string {
    return this.forecastService.getStatusIcon(status);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU');
  }
}


