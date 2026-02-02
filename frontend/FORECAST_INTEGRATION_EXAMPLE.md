# Forecast Service Integration Example

This document shows how to integrate the Forecast Service into the Angular frontend.

## Step 1: Create Forecast Service

Create `src/app/services/forecast.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ForecastRequest {
  metric_name: string;
  mon_obj: string;
  from_timestamp: number;
  forecast_periods: number;
  freq?: string;
  step?: string;
  seasonality_mode?: 'additive' | 'multiplicative';
  changepoint_prior_scale?: number;
}

export interface ForecastResponse {
  status: string;
  message: string;
  forecast_points: number;
  metric_name: string;
  mon_obj: string;
  start_date: string;
  end_date: string;
}

export interface ForecastError {
  status: string;
  message: string;
  detail?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ForecastService {
  private readonly apiUrl: string;

  constructor(private http: HttpClient) {
    // Update this URL to match your deployment
    this.apiUrl = environment.forecastServiceUrl || 'http://localhost:8082/api/v1';
  }

  /**
   * Generate a forecast for a specific metric
   */
  generateForecast(request: ForecastRequest): Observable<ForecastResponse> {
    const url = `${this.apiUrl}/forecast`;
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<ForecastResponse>(url, request, { headers }).pipe(
      catchError(error => {
        console.error('Forecast generation failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if forecast service is healthy
   */
  checkHealth(): Observable<boolean> {
    const url = this.apiUrl.replace('/api/v1', '/health');
    
    return this.http.get<any>(url).pipe(
      map(response => response.status === 'healthy'),
      catchError(() => {
        return throwError(() => new Error('Forecast service is unavailable'));
      })
    );
  }

  /**
   * Helper method to calculate timestamp for X days ago
   */
  getDaysAgoTimestamp(days: number): number {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    return Math.floor(daysAgo.getTime() / 1000);
  }
}
```

## Step 2: Update Environment Configuration

Update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8081',
  forecastServiceUrl: 'http://localhost:8082/api/v1'
};
```

Update `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiBaseUrl: '/api',  // Use relative path in production
  forecastServiceUrl: '/forecast-api/v1'  // Configure nginx to proxy this
};
```

## Step 3: Add Forecast Button to Chart Widget

Modify the chart widget component to add forecasting capability:

```typescript
// In chart-widget.component.ts

import { ForecastService, ForecastRequest } from '../../../services/forecast.service';

export class ChartWidgetComponent implements OnInit {
  // ... existing code ...
  
  isForecasting = false;
  forecastError: string | null = null;

  constructor(
    // ... existing dependencies ...
    private forecastService: ForecastService
  ) {}

  /**
   * Generate forecast for the current metric
   */
  generateForecast(): void {
    if (!this.widgetConfig?.metric || !this.widgetConfig?.monObj) {
      this.forecastError = 'Missing metric or monitoring object';
      return;
    }

    this.isForecasting = true;
    this.forecastError = null;

    // Prepare forecast request
    const request: ForecastRequest = {
      metric_name: this.widgetConfig.metric,
      mon_obj: this.widgetConfig.monObj,
      from_timestamp: this.forecastService.getDaysAgoTimestamp(30), // Use last 30 days
      forecast_periods: 24, // Forecast 24 periods
      freq: 'H', // Hourly
      step: '1h',
      seasonality_mode: 'additive',
      changepoint_prior_scale: 0.05
    };

    this.forecastService.generateForecast(request).subscribe({
      next: (response) => {
        console.log('Forecast generated:', response);
        this.isForecasting = false;
        
        // Refresh the chart to show forecasted data
        this.refreshChartWithForecast();
        
        // Show success message
        this.showSuccessMessage(`Forecast generated: ${response.forecast_points} points`);
      },
      error: (error) => {
        console.error('Forecast failed:', error);
        this.isForecasting = false;
        this.forecastError = error.error?.detail || 'Failed to generate forecast';
      }
    });
  }

  /**
   * Refresh chart data including forecast
   */
  private refreshChartWithForecast(): void {
    // Query both actual and forecasted data
    const query = `${this.widgetConfig.metric}{mon_obj="${this.widgetConfig.monObj}"}`;
    
    // Re-fetch data to include forecasted points
    // This will now include points with type="forecast" label
    this.loadChartData();
  }

  /**
   * Update chart query to distinguish actual vs forecasted data
   */
  private getChartQueryWithForecast(): string {
    const metric = this.widgetConfig.metric;
    const monObj = this.widgetConfig.monObj;
    
    // Query actual data
    const actualQuery = `${metric}{mon_obj="${monObj}",type!="forecast"}`;
    
    // Query forecast data
    const forecastQuery = `${metric}{mon_obj="${monObj}",type="forecast"}`;
    
    // Return both queries (VictoriaMetrics will return separate series)
    return `${actualQuery} or ${forecastQuery}`;
  }

  private showSuccessMessage(message: string): void {
    // Implement your notification system
    // Example with Material Snackbar:
    // this.snackBar.open(message, 'Close', { duration: 3000 });
    alert(message);
  }
}
```

## Step 4: Update Chart Widget Template

Add forecast button to `chart-widget.component.html`:

```html
<!-- Add this in the widget header/toolbar -->
<div class="widget-actions">
  <button 
    mat-icon-button 
    (click)="generateForecast()"
    [disabled]="isForecasting"
    matTooltip="Generate Forecast"
    class="forecast-button">
    <mat-icon>{{isForecasting ? 'hourglass_empty' : 'trending_up'}}</mat-icon>
  </button>
  
  <!-- Show error if forecast fails -->
  <div *ngIf="forecastError" class="forecast-error">
    <mat-icon color="warn">error</mat-icon>
    <span>{{forecastError}}</span>
  </div>
</div>
```

## Step 5: Style the Forecast Button

Add to `chart-widget.component.css`:

```css
.widget-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.forecast-button {
  transition: all 0.3s ease;
}

.forecast-button:hover:not([disabled]) {
  background-color: rgba(0, 150, 136, 0.1);
  color: #009688;
}

.forecast-button[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

.forecast-error {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #f44336;
  font-size: 12px;
  padding: 4px 8px;
  background-color: rgba(244, 67, 54, 0.1);
  border-radius: 4px;
}
```

## Step 6: Create Dedicated Forecast Dialog (Optional)

For more advanced control, create a dedicated forecast dialog:

```typescript
// forecast-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ForecastService, ForecastRequest } from '../../../services/forecast.service';

export interface ForecastDialogData {
  metricName: string;
  monObj: string;
}

@Component({
  selector: 'app-forecast-dialog',
  template: `
    <h2 mat-dialog-title>Generate Forecast</h2>
    
    <mat-dialog-content>
      <form [formGroup]="forecastForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Metric Name</mat-label>
          <input matInput formControlName="metricName" readonly>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Monitoring Object</mat-label>
          <input matInput formControlName="monObj" readonly>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Historical Data (days)</mat-label>
          <input matInput type="number" formControlName="historicalDays">
          <mat-hint>Number of days of historical data to use</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Forecast Periods</mat-label>
          <input matInput type="number" formControlName="forecastPeriods">
          <mat-hint>Number of periods to forecast</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Frequency</mat-label>
          <mat-select formControlName="freq">
            <mat-option value="H">Hourly</mat-option>
            <mat-option value="D">Daily</mat-option>
            <mat-option value="W">Weekly</mat-option>
            <mat-option value="M">Monthly</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Seasonality Mode</mat-label>
          <mat-select formControlName="seasonalityMode">
            <mat-option value="additive">Additive</mat-option>
            <mat-option value="multiplicative">Multiplicative</mat-option>
          </mat-select>
          <mat-hint>Additive for stable patterns, Multiplicative for growing trends</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Trend Flexibility</mat-label>
          <input matInput type="number" formControlName="changepointPriorScale" 
                 step="0.01" min="0.001" max="1">
          <mat-hint>0.001 (conservative) to 1.0 (aggressive)</mat-hint>
        </mat-form-field>
      </form>

      <div *ngIf="error" class="error-message">
        <mat-icon color="warn">error</mat-icon>
        <span>{{error}}</span>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" 
              (click)="onGenerate()"
              [disabled]="!forecastForm.valid || isGenerating">
        <mat-icon *ngIf="!isGenerating">trending_up</mat-icon>
        <mat-spinner *ngIf="isGenerating" diameter="20"></mat-spinner>
        {{isGenerating ? 'Generating...' : 'Generate Forecast'}}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      padding: 12px;
      background-color: rgba(244, 67, 54, 0.1);
      border-radius: 4px;
      margin-top: 16px;
    }

    mat-dialog-content {
      min-width: 400px;
      max-height: 600px;
    }
  `]
})
export class ForecastDialogComponent {
  forecastForm: FormGroup;
  isGenerating = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private forecastService: ForecastService,
    private dialogRef: MatDialogRef<ForecastDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ForecastDialogData
  ) {
    this.forecastForm = this.fb.group({
      metricName: [data.metricName, Validators.required],
      monObj: [data.monObj, Validators.required],
      historicalDays: [30, [Validators.required, Validators.min(1), Validators.max(365)]],
      forecastPeriods: [24, [Validators.required, Validators.min(1), Validators.max(1000)]],
      freq: ['H', Validators.required],
      seasonalityMode: ['additive', Validators.required],
      changepointPriorScale: [0.05, [Validators.required, Validators.min(0.001), Validators.max(1)]]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onGenerate(): void {
    if (!this.forecastForm.valid) {
      return;
    }

    this.isGenerating = true;
    this.error = null;

    const formValue = this.forecastForm.value;
    const fromTimestamp = this.forecastService.getDaysAgoTimestamp(formValue.historicalDays);

    const request: ForecastRequest = {
      metric_name: formValue.metricName,
      mon_obj: formValue.monObj,
      from_timestamp: fromTimestamp,
      forecast_periods: formValue.forecastPeriods,
      freq: formValue.freq,
      step: this.getStepFromFreq(formValue.freq),
      seasonality_mode: formValue.seasonalityMode,
      changepoint_prior_scale: formValue.changepointPriorScale
    };

    this.forecastService.generateForecast(request).subscribe({
      next: (response) => {
        console.log('Forecast generated:', response);
        this.isGenerating = false;
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Forecast failed:', error);
        this.isGenerating = false;
        this.error = error.error?.detail || 'Failed to generate forecast';
      }
    });
  }

  private getStepFromFreq(freq: string): string {
    const stepMap: { [key: string]: string } = {
      'H': '1h',
      'D': '1d',
      'W': '1w',
      'M': '30d'
    };
    return stepMap[freq] || '1h';
  }
}
```

## Step 7: Use Forecast Dialog in Chart Widget

```typescript
// In chart-widget.component.ts
import { MatDialog } from '@angular/material/dialog';
import { ForecastDialogComponent } from './forecast-dialog/forecast-dialog.component';

export class ChartWidgetComponent {
  constructor(
    // ... existing dependencies ...
    private dialog: MatDialog
  ) {}

  openForecastDialog(): void {
    const dialogRef = this.dialog.open(ForecastDialogComponent, {
      width: '500px',
      data: {
        metricName: this.widgetConfig.metric,
        monObj: this.widgetConfig.monObj
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Forecast completed:', result);
        this.refreshChartWithForecast();
      }
    });
  }
}
```

## Step 8: Query Forecasted Data Separately

If you want to display actual and forecasted data as separate series in the chart:

```typescript
// In your chart data loading method
private loadChartData(): void {
  const metric = this.widgetConfig.metric;
  const monObj = this.widgetConfig.monObj;
  const timeRange = this.getTimeRange();

  // Query actual data
  const actualQuery = {
    query: `${metric}{mon_obj="${monObj}",type!="forecast"}`,
    start: timeRange.start,
    end: timeRange.end,
    step: '1h'
  };

  // Query forecast data
  const forecastQuery = {
    query: `${metric}{mon_obj="${monObj}",type="forecast"}`,
    start: timeRange.start,
    end: timeRange.end,
    step: '1h'
  };

  // Fetch both datasets
  forkJoin({
    actual: this.apiService.queryVictoriaMetrics(actualQuery),
    forecast: this.apiService.queryVictoriaMetrics(forecastQuery)
  }).subscribe({
    next: (data) => {
      this.renderChart({
        actual: this.parseVictoriaMetricsData(data.actual),
        forecast: this.parseVictoriaMetricsData(data.forecast)
      });
    },
    error: (error) => {
      console.error('Failed to load chart data:', error);
    }
  });
}

private renderChart(data: { actual: any[], forecast: any[] }): void {
  // Configure chart with two series
  const chartOptions = {
    series: [
      {
        name: 'Actual',
        data: data.actual,
        type: 'line',
        color: '#2196F3'
      },
      {
        name: 'Forecast',
        data: data.forecast,
        type: 'line',
        color: '#FF9800',
        dashStyle: 'dash' // Make forecast line dashed
      }
    ],
    // ... other chart options
  };

  // Render chart with Highcharts or your chosen library
  this.chart = Highcharts.chart(this.chartContainer.nativeElement, chartOptions);
}
```

## Complete Usage Flow

1. User opens dashboard with chart widgets
2. User clicks "Forecast" button on a widget
3. Forecast dialog opens with configurable parameters
4. User adjusts parameters (periods, frequency, etc.)
5. User clicks "Generate Forecast"
6. Frontend calls Forecast Service API
7. Forecast Service fetches data from VictoriaMetrics
8. Prophet generates forecast
9. Forecast is written back to VictoriaMetrics with `type=forecast` label
10. Frontend refreshes chart to display both actual and forecasted data
11. Chart shows actual data (solid line) and forecast (dashed line)

## Testing

Test the integration:

```typescript
// forecast.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ForecastService, ForecastRequest } from './forecast.service';

describe('ForecastService', () => {
  let service: ForecastService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ForecastService]
    });
    service = TestBed.inject(ForecastService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should generate forecast successfully', () => {
    const mockRequest: ForecastRequest = {
      metric_name: 'cpu_usage',
      mon_obj: 'server-01',
      from_timestamp: 1704067200,
      forecast_periods: 24,
      freq: 'H'
    };

    const mockResponse = {
      status: 'success',
      message: 'Forecast completed',
      forecast_points: 24,
      metric_name: 'cpu_usage',
      mon_obj: 'server-01',
      start_date: '2024-01-01T12:00:00',
      end_date: '2024-01-02T11:00:00'
    };

    service.generateForecast(mockRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/forecast`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRequest);
    req.flush(mockResponse);
  });

  it('should handle forecast errors', () => {
    const mockRequest: ForecastRequest = {
      metric_name: 'invalid',
      mon_obj: 'server-01',
      from_timestamp: 1704067200,
      forecast_periods: 24
    };

    service.generateForecast(mockRequest).subscribe(
      () => fail('should have failed'),
      (error) => {
        expect(error.status).toBe(400);
      }
    );

    const req = httpMock.expectOne(`${service['apiUrl']}/forecast`);
    req.flush({ message: 'Invalid metric' }, { status: 400, statusText: 'Bad Request' });
  });
});
```

## Next Steps

1. Implement the forecast service in Angular
2. Add forecast button to relevant chart widgets
3. Test with actual data from VictoriaMetrics
4. Customize styling to match your app theme
5. Add error handling and user notifications
6. Consider adding forecast visualization options (confidence intervals, etc.)


