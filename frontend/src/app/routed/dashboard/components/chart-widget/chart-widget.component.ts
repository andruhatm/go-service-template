import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit, OnChanges, SimpleChanges, ElementRef, HostListener } from '@angular/core';
import { DashboardService, Widget, MetricsQueryRequest } from '../../services/dashboard.service';
import { HttpClient } from '@angular/common/http';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface ChartData {
  name: string;
  series: Array<{ name: string; value: number }>;
}

interface Threshold {
  operator: string;  // '<', '>', '<=', '>=', '='
  value: number;
  label: string;
}

@Component({
  selector: 'app-chart-widget',
  templateUrl: './chart-widget.component.html',
  styleUrls: ['./chart-widget.component.css']
})
export class ChartWidgetComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @Input() widget!: Widget;
  @Input() period: number = 3600; // Default 1 hour in seconds
  @Input() dateFrom: string | null = null;
  @Input() dateTo: string | null = null;
  @Input() autoRefresh: boolean = false;
  @Input() refreshInterval: number = 60000; // 60 seconds
  @Input() showThresholds: boolean = false; // Show warning/error thresholds
  @Output() removeWidget = new EventEmitter<Widget>();

  chartData: ChartData[] = [];
  loading = true;
  error: string | null = null;
  
  // Threshold data
  thresholdWarning: Threshold | null = null;
  thresholdCritical: Threshold | null = null;
  
  // Chart options - will be calculated dynamically
  view: [number, number] | undefined = undefined; // Undefined means responsive
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
  referenceLines: any[] = [];
  yScaleMin: number | undefined = undefined;
  yScaleMax: number | undefined = undefined;

  private refreshSubscription?: Subscription;

  constructor(
    private dashboardService: DashboardService,
    private elementRef: ElementRef,
    private http: HttpClient
  ) {}

  @HostListener('window:resize')
  onResize(): void {
    this.updateChartSize();
  }

  // Listen for gridster item resize events
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    // Update chart size after view is initialized
    setTimeout(() => {
      this.updateChartSize();
    }, 100);

    // Set up resize observer to detect gridster item resizing
    const container = this.elementRef.nativeElement.closest('gridster-item');
    if (container && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateChartSize();
      });
      this.resizeObserver.observe(container);
    }
  }

  ngOnInit(): void {
    this.updateChartSize();
    this.loadThresholds();
    this.loadData();
    
    if (this.autoRefresh) {
      this.startAutoRefresh();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload thresholds when showThresholds changes
    if (changes['showThresholds'] && !changes['showThresholds'].firstChange) {
      this.loadThresholds();
    }

    if (
      (changes['period'] && !changes['period'].firstChange) ||
      (changes['dateFrom'] && !changes['dateFrom'].firstChange) ||
      (changes['dateTo'] && !changes['dateTo'].firstChange)
    ) {
      this.loadData();
    }

    if (
      (changes['autoRefresh'] && !changes['autoRefresh'].firstChange) ||
      (changes['refreshInterval'] && !changes['refreshInterval'].firstChange)
    ) {
      if (this.autoRefresh) {
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    }
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
    
    // Clean up resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
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
    const range = this.getCustomRange();
    const effectivePeriod = this.getEffectivePeriodSeconds(range);
    
    // Determine startTime and endTime
    let startTime: number;
    let endTime: number;
    
    if (range) {
      // Use custom date range
      startTime = range.startTime;
      endTime = range.endTime;
    } else if (this.period > 0) {
      // Use predefined period
      startTime = now - this.period;
      endTime = now;
    } else {
      // Period is 0 (custom) but no dates set - use default 1 hour
      startTime = now - 3600;
      endTime = now;
    }
    
    const request: MetricsQueryRequest = {
      metricName: this.widget.metricName,
      objectName: this.widget.objectName,
      startTime: startTime,
      endTime: endTime,
      step: Math.max(Math.floor(effectivePeriod / 100), 60) // Adaptive step
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
              name: this.formatTimestamp(timestamp),
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
      
      // Update Y-axis scale to include thresholds
      this.updateYAxisScale();
    } else {
      this.error = response.error || 'Нет данных';
    }
  }

  private formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const effectivePeriod = this.getEffectivePeriodSeconds();
    
    // For periods less than 1 day, show only time
    if (effectivePeriod < 86400) {
      return date.toLocaleTimeString('ru-RU');
    }
    
    // For periods 1 day to 7 days, show date and time
    if (effectivePeriod < 604800) {
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // For periods longer than 7 days, show date with short time
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  refresh(): void {
    this.loadData();
  }

  remove(): void {
    this.removeWidget.emit(this.widget);
  }

  updateChartSize(): void {
    // Get the container element
    const container = this.elementRef.nativeElement.querySelector('.chart-container');
    if (container) {
      const width = container.offsetWidth - 40; // Subtract padding
      const height = container.offsetHeight - 40; // Subtract padding
      
      // Ensure minimum sizes
      const finalWidth = Math.max(width, 300);
      const finalHeight = Math.max(height, 250);
      
      this.view = [finalWidth, finalHeight];
    }
  }

  loadThresholds(): void {
    if (!this.showThresholds || !this.widget.metricId) {
      // Clear reference lines if thresholds are disabled
      this.referenceLines = [];
      return;
    }

    // Fetch metric details from metrics catalog
    this.http.get<any>(`http://localhost:8081/api/metrics-catalog/${this.widget.metricId}`).subscribe({
      next: (metric) => {
        // Parse threshold values with operators
        if (metric.threshold_warning) {
          this.thresholdWarning = this.parseThreshold(metric.threshold_warning, 'Предупреждение');
        }
        if (metric.threshold_critical) {
          this.thresholdCritical = this.parseThreshold(metric.threshold_critical, 'Критический');
        }
        
        // Update reference lines
        this.updateReferenceLines();
        
        console.log('Thresholds loaded:', {
          warning: this.thresholdWarning,
          critical: this.thresholdCritical,
          referenceLines: this.referenceLines
        });
      },
      error: (error) => {
        console.error('Error loading thresholds:', error);
      }
    });
  }

  updateReferenceLines(): void {
    // Build complete list of reference lines (before filtering)
    const allReferenceLines: any[] = [];
    
    if (this.showThresholds) {
      if (this.thresholdWarning !== null) {
        allReferenceLines.push({
          name: this.thresholdWarning.label,
          value: this.thresholdWarning.value
        });
      }
      
      if (this.thresholdCritical !== null) {
        allReferenceLines.push({
          name: this.thresholdCritical.label,
          value: this.thresholdCritical.value
        });
      }
    }
    
    // Set all reference lines (will be filtered by updateYAxisScale based on data range)
    this.referenceLines = allReferenceLines;
    
    // Update Y-axis scale and filter thresholds based on data range
    this.updateYAxisScale();
  }

  updateYAxisScale(): void {
    // Calculate min and max from data
    let dataMin: number | undefined = undefined;
    let dataMax: number | undefined = undefined;
    
    if (this.chartData && this.chartData.length > 0) {
      this.chartData.forEach(series => {
        series.series.forEach(point => {
          if (dataMin === undefined || point.value < dataMin) {
            dataMin = point.value;
          }
          if (dataMax === undefined || point.value > dataMax) {
            dataMax = point.value;
          }
        });
      });
    }
    
    // Filter reference lines to only show thresholds within or near data range
    if (this.showThresholds && dataMin !== undefined && dataMax !== undefined) {
      const dataRange = dataMax - dataMin;
      const tolerance = dataRange * 0.5; // Show thresholds within 50% of data range
      
      // Filter reference lines
      this.referenceLines = this.referenceLines.filter(line => {
        const threshold = line.value;
        // Show threshold if it's within the extended range
        return threshold >= (dataMin! - tolerance) && threshold <= (dataMax! + tolerance);
      });
    }
    
    // Scale based on actual data range only (not thresholds)
    if (dataMin !== undefined && dataMax !== undefined) {
      const range = dataMax - dataMin;
      const padding = range * 0.1;
      
      this.yScaleMin = dataMin - padding;
      this.yScaleMax = dataMax + padding;
    } else {
      // No data, let chart auto-scale
      this.yScaleMin = undefined;
      this.yScaleMax = undefined;
    }
  }

  parseThreshold(threshold: string, label: string): Threshold | null {
    if (!threshold) return null;
    
    // Decode Unicode escapes (e.g., \u003e becomes >)
    const decoded = threshold.replace(/\\u[\dA-F]{4}/gi, 
      (match) => String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16)));
    
    // Extract operator and value
    // Formats: "< -120", "> 10", "<= 98", ">= 5", "= 100"
    const match = decoded.match(/^([<>=]+)\s*([-+]?\d+\.?\d*)/);
    
    if (!match) {
      console.warn('Unable to parse threshold:', threshold);
      return null;
    }
    
    const operator = match[1].trim();
    const value = parseFloat(match[2]);
    
    if (isNaN(value)) {
      console.warn('Invalid threshold value:', threshold);
      return null;
    }
    
    // Create label with operator direction
    const directionLabel = this.getOperatorLabel(operator);
    
    return {
      operator,
      value,
      label: `${label} (${directionLabel} ${value})`
    };
  }

  getOperatorLabel(operator: string): string {
    switch (operator) {
      case '>': return '>';
      case '<': return '<';
      case '>=': return '≥';
      case '<=': return '≤';
      case '=': return '=';
      default: return operator;
    }
  }

  private getCustomRange(): { startTime: number; endTime: number } | null {
    const now = Math.floor(Date.now() / 1000);
    
    // If neither date is set, return null
    if (!this.dateFrom && !this.dateTo) {
      return null;
    }
    
    let startTime: number;
    let endTime: number;
    
    // Parse dates
    const start = this.dateFrom ? Date.parse(this.dateFrom) : null;
    const end = this.dateTo ? Date.parse(this.dateTo) : null;
    
    // Case 1: Both dates are set
    if (start !== null && end !== null) {
      if (Number.isNaN(start) || Number.isNaN(end)) {
        console.warn('Invalid date format:', this.dateFrom, this.dateTo);
        return null;
      }
      
      if (end <= start) {
        console.warn('End date must be after start date:', this.dateFrom, this.dateTo);
        return null;
      }
      
      return {
        startTime: Math.floor(start / 1000),
        endTime: Math.floor(end / 1000)
      };
    }
    
    // Case 2: Only "Date from" is set - use it as start, current time as end
    if (start !== null && end === null) {
      if (Number.isNaN(start)) {
        console.warn('Invalid start date format:', this.dateFrom);
        return null;
      }
      
      startTime = Math.floor(start / 1000);
      endTime = now;
      
      // Validate: start must be before now
      if (startTime >= now) {
        console.warn('Start date must be before current time:', this.dateFrom);
        return null;
      }
      
      console.log('Using custom start date with current time as end:', { startTime, endTime });
      return { startTime, endTime };
    }
    
    // Case 3: Only "Date to" is set - use current time minus default period as start
    if (start === null && end !== null) {
      if (Number.isNaN(end)) {
        console.warn('Invalid end date format:', this.dateTo);
        return null;
      }
      
      endTime = Math.floor(end / 1000);
      // Use 1 hour before end date as start
      startTime = endTime - 3600;
      
      console.log('Using custom end date with calculated start:', { startTime, endTime });
      return { startTime, endTime };
    }
    
    return null;
  }

  private getEffectivePeriodSeconds(range: { startTime: number; endTime: number } | null = this.getCustomRange()): number {
    if (range) {
      // Use custom range duration
      return Math.max(range.endTime - range.startTime, 60);
    }
    if (this.period > 0) {
      // Use predefined period
      return this.period;
    }
    // Default to 1 hour if period is 0 and no custom range
    return 3600;
  }
}

