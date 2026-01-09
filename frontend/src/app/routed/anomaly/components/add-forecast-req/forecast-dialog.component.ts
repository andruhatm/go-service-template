import {Component, OnInit} from "@angular/core";
import {MatDialogRef} from "@angular/material/dialog";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ForecastService, ForecastCreateRequest} from "../../../../services/forecast.service";
import {MonObjectsService, MonObject} from "../../../../services/mon-objects.service";
import {MetricsCatalogService, MetricCatalog} from "../../../../services/metrics-catalog.service";
import {timeout, catchError} from 'rxjs/operators';
import {of} from 'rxjs';

@Component({
  selector: 'forecast-add-dialog',
  styleUrls: ['./forecast-dialog.component.css'],
  templateUrl: './forecast.dialog.component.html',
})
export class ForecastDialogComponent implements OnInit{
  // Step 1: Mon Object selection
  monObjectFormGroup: FormGroup;
  // Step 2: Metric selection
  metricFormGroup: FormGroup;
  // Step 3: Configuration form
  configFormGroup: FormGroup;
  
  monObjects: MonObject[] = [];
  metrics: MetricCatalog[] = [];
  
  // Filtered lists for search
  filteredMonObjects: MonObject[] = [];
  filteredMetrics: MetricCatalog[] = [];
  
  // Search terms
  monObjectSearchTerm = '';
  metricSearchTerm = '';
  
  loading = false;
  submitting = false;
  error: string | null = null;

  frequencies = [
    { value: 'H', label: 'Час' },
    { value: 'D', label: 'День' },
    { value: 'W', label: 'Неделя' },
    { value: 'M', label: 'Месяц' }
  ];

  seasonalityModes = [
    { value: 'additive', label: 'Аддитивная' },
    { value: 'multiplicative', label: 'Мультипликативная' }
  ];

  constructor(
    public dialogRef: MatDialogRef<ForecastDialogComponent>,
    private readonly fb: FormBuilder,
    private readonly forecastService: ForecastService,
    private readonly monObjectsService: MonObjectsService,
    private readonly metricsCatalogService: MetricsCatalogService
  ) {}

  ngOnInit() {
    this.initForms();
    this.loadData();
  }

  private initForms(): void {
    // Step 1: Mon Object selection
    this.monObjectFormGroup = this.fb.group({
      mon_object_name: ['', Validators.required]
    });

    // Step 2: Metric selection
    this.metricFormGroup = this.fb.group({
      metric_name: ['', Validators.required]
    });

    // Step 3: Configuration form
    this.configFormGroup = this.fb.group({
      historical_days: [30, [Validators.required, Validators.min(1), Validators.max(365)]],
      forecast_periods: [24, [Validators.required, Validators.min(1), Validators.max(1000)]],
      freq: ['H', Validators.required],
      step: ['1h', Validators.required],
      seasonality_mode: ['additive', Validators.required],
      changepoint_prior_scale: [0.05, [Validators.required, Validators.min(0.001), Validators.max(1)]]
    });
  }

  private loadData(): void {
    this.loading = true;
    this.error = null;
    
    let monObjectsLoaded = false;
    let metricsLoaded = false;

    const checkLoadingComplete = () => {
      if (monObjectsLoaded && metricsLoaded) {
        this.loading = false;
        console.log('All data loaded successfully');
      }
    };
    
    // Load mon objects with timeout
    this.monObjectsService.getMonObjects()
      .pipe(
        timeout(10000), // 10 second timeout
        catchError(err => {
          console.error('Timeout or error loading mon objects:', err);
          return of([]);
        })
      )
      .subscribe({
        next: (monObjects) => {
          console.log('MonObjects loaded:', monObjects);
          this.monObjects = monObjects || [];
          this.filteredMonObjects = this.monObjects.slice();
          console.log('Filtered MonObjects:', this.filteredMonObjects);
          
          if (this.monObjects.length === 0) {
            console.warn('No mon objects found or request failed');
          }
          
          monObjectsLoaded = true;
          checkLoadingComplete();
        },
        error: (err) => {
          console.error('Failed to load mon objects:', err);
          this.error = 'Не удалось загрузить объекты мониторинга';
          this.loading = false;
        }
      });

    // Load metrics with timeout
    this.metricsCatalogService.getMetrics()
      .pipe(
        timeout(10000), // 10 second timeout
        catchError(err => {
          console.error('Timeout or error loading metrics:', err);
          return of([]);
        })
      )
      .subscribe({
        next: (metrics) => {
          console.log('Metrics loaded:', metrics);
          this.metrics = metrics || [];
          this.filteredMetrics = this.metrics.slice();
          console.log('Filtered Metrics:', this.filteredMetrics);
          
          if (this.metrics.length === 0) {
            console.warn('No metrics found or request failed');
          }
          
          metricsLoaded = true;
          checkLoadingComplete();
        },
        error: (err) => {
          console.error('Failed to load metrics:', err);
          this.error = 'Не удалось загрузить метрики';
          this.loading = false;
        }
      });
  }

  // Filter mon objects based on search term
  filterMonObjects(): void {
    const searchTerm = this.monObjectSearchTerm.toLowerCase().trim();
    if (!searchTerm) {
      // Create new array to trigger change detection
      this.filteredMonObjects = this.monObjects.slice();
      return;
    }
    
    // Create new filtered array
    this.filteredMonObjects = this.monObjects.filter(obj => 
      obj.name.toLowerCase().includes(searchTerm) || 
      (obj.type && obj.type.toLowerCase().includes(searchTerm))
    );
  }

  // Filter metrics based on search term
  filterMetrics(): void {
    const searchTerm = this.metricSearchTerm.toLowerCase().trim();
    if (!searchTerm) {
      // Create new array to trigger change detection
      this.filteredMetrics = this.metrics.slice();
      return;
    }
    
    // Create new filtered array
    this.filteredMetrics = this.metrics.filter(metric => 
      metric.name.toLowerCase().includes(searchTerm) || 
      (metric.group && metric.group.toLowerCase().includes(searchTerm))
    );
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  handleFormSubmit(): void {
    if (!this.monObjectFormGroup.valid || !this.metricFormGroup.valid || !this.configFormGroup.valid) {
      return;
    }

    this.submitting = true;
    this.error = null;
    
    const monObjectValue = this.monObjectFormGroup.value;
    const metricValue = this.metricFormGroup.value;
    const configValue = this.configFormGroup.value;

    // Calculate from_timestamp (days ago from now)
    const fromTimestamp = this.forecastService.getDaysAgoTimestamp(configValue.historical_days);

    const request: ForecastCreateRequest = {
      mon_object_name: monObjectValue.mon_object_name,
      metric_name: metricValue.metric_name,
      from_timestamp: fromTimestamp,
      forecast_periods: configValue.forecast_periods,
      freq: configValue.freq,
      step: configValue.step,
      seasonality_mode: configValue.seasonality_mode,
      changepoint_prior_scale: configValue.changepoint_prior_scale
    };

    this.forecastService.createForecast(request).subscribe({
      next: (result) => {
        console.log('Forecast created:', result);
        this.dialogRef.close(result);
      },
      error: (err) => {
        console.error('Failed to create forecast:', err);
        this.error = err.error?.message || 'Не удалось создать прогноз';
        this.submitting = false;
      }
    });
  }

  // Helper to update step based on freq selection
  onFreqChange(): void {
    const freq = this.configFormGroup.get('freq')?.value;
    const stepMap: { [key: string]: string } = {
      'H': '1h',
      'D': '1d',
      'W': '1w',
      'M': '30d'
    };
    this.configFormGroup.patchValue({ step: stepMap[freq] || '1h' });
  }

  // TrackBy functions for performance
  trackByName(_index: number, item: MonObject): string {
    return item.name;
  }

  trackByMetricName(_index: number, item: MetricCatalog): string {
    return item.name;
  }
}
