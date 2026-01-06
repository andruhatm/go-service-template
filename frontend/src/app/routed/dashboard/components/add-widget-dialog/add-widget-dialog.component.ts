import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

interface MonObject {
  id: string;
  name: string;
  type?: string;
}

interface Metric {
  id: string;
  name: string;
  description?: string;
  group?: string;
  unit?: string;
}

@Component({
  selector: 'app-add-widget-dialog',
  templateUrl: './add-widget-dialog.component.html',
  styleUrls: ['./add-widget-dialog.component.css']
})
export class AddWidgetDialogComponent implements OnInit {
  widgetForm: FormGroup;
  monObjects: MonObject[] = [];
  metrics: Metric[] = [];
  filteredMonObjects: Observable<MonObject[]>;
  filteredMetrics: Observable<Metric[]>;
  loading = false;

  // Store selected values
  selectedObject: MonObject | null = null;
  selectedMetric: Metric | null = null;

  constructor(
    public dialogRef: MatDialogRef<AddWidgetDialogComponent>,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.widgetForm = this.fb.group({
      title: ['', Validators.required],
      type: ['line-chart', Validators.required],
      objectId: ['', Validators.required],
      objectSearch: [''],
      metricId: ['', Validators.required],
      metricSearch: ['']
    });
  }

  ngOnInit(): void {
    this.loadMonObjects();
    this.loadMetrics();
    this.setupFilters();
  }

  setupFilters(): void {
    // Filter monitoring objects based on search input
    this.filteredMonObjects = this.widgetForm.get('objectSearch')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        const searchValue = typeof value === 'string' ? value : '';
        return this._filterMonObjects(searchValue);
      })
    );

    // Filter metrics based on search input
    this.filteredMetrics = this.widgetForm.get('metricSearch')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        const searchValue = typeof value === 'string' ? value : '';
        return this._filterMetrics(searchValue);
      })
    );
  }

  private _filterMonObjects(value: string): MonObject[] {
    if (!value || value.trim() === '') {
      return this.monObjects;
    }
    const filterValue = value.toLowerCase().trim();
    return this.monObjects.filter(obj => 
      obj.name.toLowerCase().includes(filterValue) || 
      (obj.type && obj.type.toLowerCase().includes(filterValue))
    );
  }

  private _filterMetrics(value: string): Metric[] {
    if (!value || value.trim() === '') {
      return this.metrics;
    }
    const filterValue = value.toLowerCase().trim();
    return this.metrics.filter(metric => 
      metric.name.toLowerCase().includes(filterValue) ||
      (metric.group && metric.group.toLowerCase().includes(filterValue)) ||
      (metric.description && metric.description.toLowerCase().includes(filterValue))
    );
  }

  loadMonObjects(): void {
    this.loading = true;
    // Fetch monitoring objects
    this.http.get<any>('http://localhost:8081/api/mon-objects?pageSize=200').subscribe({
      next: (response) => {
        this.monObjects = response.items || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading mon objects:', error);
        this.loading = false;
      }
    });
  }

  loadMetrics(): void {
    this.loading = true;
    // Fetch metrics with page size 200
    this.http.get<any>('http://localhost:8081/api/metrics-catalog?pageSize=200').subscribe({
      next: (response) => {
        this.metrics = response.items || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading metrics:', error);
        this.loading = false;
      }
    });
  }

  onObjectSelected(object: MonObject): void {
    this.selectedObject = object;
    this.widgetForm.patchValue({
      objectId: object.id,
      objectSearch: object.name
    });
  }

  onMetricSelected(metric: Metric): void {
    this.selectedMetric = metric;
    this.widgetForm.patchValue({
      metricId: metric.id,
      metricSearch: metric.name
    });
  }

  displayMonObject(obj: MonObject | string): string {
    if (typeof obj === 'string') {
      return obj;
    }
    return obj ? obj.name : '';
  }

  displayMetric(metric: Metric | string): string {
    if (typeof metric === 'string') {
      return metric;
    }
    return metric ? metric.name : '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.widgetForm.valid) {
      const formValue = this.widgetForm.value;

      const widget = {
        id: this.generateId(),
        type: formValue.type,
        title: formValue.title,
        objectId: formValue.objectId,
        objectName: this.selectedObject?.name || '',
        metricId: formValue.metricId,
        metricName: this.selectedMetric?.name || '',
        position: { x: 0, y: 0, w: 6, h: 4 }
      };

      this.dialogRef.close(widget);
    }
  }

  private generateId(): string {
    return 'widget-' + Math.random().toString(36).substr(2, 9);
  }
}

