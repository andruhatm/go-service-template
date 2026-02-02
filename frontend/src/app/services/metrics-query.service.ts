import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface MetricDataPoint {
  timestamp: number;
  value: number;
}

export interface VMMetric {
  metric: { [key: string]: string };
  values: Array<[number, string]>;
}

export interface VMData {
  resultType: string;
  result: VMMetric[];
}

export interface VMResponse {
  status: string;
  data: VMData;
}

@Injectable({
  providedIn: 'root'
})
export class MetricsQueryService {
  private apiUrl = `${environment.api}/metrics/query`;

  constructor(private http: HttpClient) {}

  /**
   * Query metrics from VictoriaMetrics
   * @param metricName - Name of the metric to query
   * @param objectName - Name of the monitoring object
   * @param startTime - Start timestamp (Unix seconds)
   * @param endTime - End timestamp (Unix seconds)
   * @param step - Step interval (e.g., '1h', '5m')
   * @param type - Optional type filter ('actual', 'forecast', etc.)
   * @param forecastId - Optional forecast ID for filtering forecast data
   */
  queryMetrics(
    metricName: string,
    objectName: string,
    startTime: number,
    endTime: number,
    step: string = '1h',
    type?: string,
    forecastId?: string
  ): Observable<MetricDataPoint[]> {
    // Convert step to seconds
    const stepSeconds = this.parseStepToSeconds(step);

    const requestBody = {
      metricName: metricName,
      objectName: objectName,
      startTime: startTime,
      endTime: endTime,
      step: stepSeconds,
      type: type,
      forecastId: forecastId
    };

    return this.http.post<VMResponse>(this.apiUrl, requestBody).pipe(
      map(response => this.transformVMResponse(response))
    );
  }

  /**
   * Transform VictoriaMetrics response to simple data points array
   */
  private transformVMResponse(response: VMResponse): MetricDataPoint[] {
    if (!response || !response.data || !response.data.result || response.data.result.length === 0) {
      return [];
    }

    const dataPoints: MetricDataPoint[] = [];

    // VictoriaMetrics returns data in format: [[timestamp, value], ...]
    for (const result of response.data.result) {
      if (result.values && Array.isArray(result.values)) {
        for (const [timestamp, value] of result.values) {
          dataPoints.push({
            timestamp: timestamp,
            value: parseFloat(value)
          });
        }
      }
    }

    // Sort by timestamp
    dataPoints.sort((a, b) => a.timestamp - b.timestamp);

    return dataPoints;
  }

  /**
   * Parse step string to seconds
   * Examples: '1h' -> 3600, '5m' -> 300, '30s' -> 30
   */
  private parseStepToSeconds(step: string): number {
    const match = step.match(/^(\d+)([smhd])$/);
    if (!match) {
      console.warn(`Invalid step format: ${step}, defaulting to 3600s`);
      return 3600; // Default to 1 hour
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 3600;
    }
  }
}


