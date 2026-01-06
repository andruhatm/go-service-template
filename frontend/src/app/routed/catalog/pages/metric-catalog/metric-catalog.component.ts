import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {EventCategory} from '../../../../features/other-model/category.model';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {MetricCatalogService, MetricCatalog} from "../../services/metric-catalog.service";
import {HttpErrorResponse} from "@angular/common/http";
import {MatPaginator, PageEvent} from "@angular/material/paginator";
import {KeycloakAuthService} from "../../../../core/auth/keycloak-auth.service";


export interface Ran1 {
  name: string;
  type?: string[];
  unit?: string;
  valuetype: string;
  aggregation: string;
}

export interface Ran2 {
  name: string;
  type?: string[];
  unit?: string;
  valuetype: string;
  degradation: string;
  threshold: string;
}

@Component({
  selector: 'app-metric-catalog',
  templateUrl: './metric-catalog.component.html',
  styleUrls: ['./metric-catalog.component.css']
})
export class MetricCatalogComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    public dialog: MatDialog,
    private metricCatalogService: MetricCatalogService,
    private keycloakAuthService: KeycloakAuthService
  ) { }

  metric = true;
  loading = false;
  totalMetrics = 0;
  currentPage = 1;
  pageSize = 20;
  selectedGroup: string | undefined;
  groups: string[] = [];
  pageSizeOptions: number[] = [10, 20, 50, 100];
  isAdmin = false;

  columns = [
    {
      columnDef: 'name',
      header: 'Имя',
      cell: (element: MetricCatalog) => `${element.name}`,
    },
    {
      columnDef: 'group',
      header: 'Группа',
      cell: (element: MetricCatalog) => `${element.group || '-'}`,
    },
    {
      columnDef: 'unit',
      header: 'Единица измерения',
      cell: (element: MetricCatalog) => `${element.unit || '-'}`,
    },
    {
      columnDef: 'degradation',
      header: 'Направление ухудшения',
      cell: (element: MetricCatalog) => `${element.degradation || '-'}`,
    },
    {
      columnDef: 'threshold_critical',
      header: 'Критический порог',
      cell: (element: MetricCatalog) => `${element.threshold_critical || '-'}`,
    },
    {
      columnDef: 'threshold_warning',
      header: 'Предупреждающий порог',
      cell: (element: MetricCatalog) => `${element.threshold_warning || '-'}`,
    },
    {
      columnDef: 'actions',
      header: 'Действия',
      cell: null, // Handled in template
    },
  ];
  columns2 = [
    {
      columnDef: 'name',
      header: 'Имя',
      cell: (element: Ran2) => `${element.name}`,
    },
    {
      columnDef: 'type',
      header: 'Тип',
      cell: (element: Ran2) => `${element.type}`,
    },
    {
      columnDef: 'unit',
      header: 'Единица измерения',
      cell: (element: Ran2) => `${element.unit}`,
    },
    {
      columnDef: 'valuetype',
      header: 'Исчисление',
      cell: (element: Ran2) => `${element.valuetype}`,
    },
    {
      columnDef: 'degradation',
      header: 'Направление ухудшения',
      cell: (element: Ran2) => `${element.degradation}`,
    },
    {
      columnDef: 'threshold',
      header: 'Ограничитель',
      cell: (element: Ran2) => `${element.threshold}`,
    },
  ];

  dataSource: MetricCatalog[] = [];
  dataSource2: Ran2[] = [];
  displayedColumns: string[] = [];
  displayedColumns2 = this.columns2.map(c => c.columnDef);

  categories: EventCategory[];

  ngOnInit(): void {
    console.log('MetricCatalogComponent');
    this.categories = [
      {nameCategory: 'Метрики',color:'#f5fd1c' },
      {nameCategory: 'КПИ',color:'#1282f8' },

    ];
    
    // Check if user is admin
    this.keycloakAuthService.authState$.subscribe(authState => {
      this.isAdmin = authState.isAdmin;
      console.log('User is admin:', this.isAdmin);
      
      // Update displayed columns based on admin status
      this.updateDisplayedColumns();
    });
    
    // Load groups first
    this.loadGroups();
    
    // Load metrics data
    this.loadMetrics();
  }

  private updateDisplayedColumns(): void {
    if (this.isAdmin) {
      // Show all columns including actions for admins
      this.displayedColumns = this.columns.map(c => c.columnDef);
    } else {
      // Hide actions column for non-admins
      this.displayedColumns = this.columns
        .filter(c => c.columnDef !== 'actions')
        .map(c => c.columnDef);
    }
  }

  loadGroups(): void {
    this.metricCatalogService.getGroups().subscribe({
      next: (response) => {
        this.groups = response.groups;
        console.log('Loaded groups:', this.groups);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load groups:', error);
      }
    });
  }

  loadMetrics(): void {
    this.loading = true;
    this.metricCatalogService.getMetrics(this.currentPage, this.pageSize, this.selectedGroup).subscribe({
      next: (response) => {
        this.dataSource = response.items;
        this.totalMetrics = response.total;
        this.loading = false;
        console.log('Loaded metrics:', response);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load metrics:', error);
        this.loading = false;
      }
    });
  }

  filterByGroup(group?: string): void {
    this.selectedGroup = group;
    this.currentPage = 1;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.loadMetrics();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadMetrics();
  }

  handleCategoryClick(item: EventCategory): void {
    console.log(item);
    this.metric = false;
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(MetricDialogComponent, {
      width: '600px',
      data: { metric: null, groups: this.groups }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createMetric(result);
      }
    });
  }

  openEditDialog(metric: MetricCatalog): void {
    const dialogRef = this.dialog.open(MetricDialogComponent, {
      width: '600px',
      data: { metric: { ...metric }, groups: this.groups }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateMetric(metric.id, result);
      }
    });
  }

  openDeleteDialog(metric: MetricCatalog): void {
    const dialogRef = this.dialog.open(DeleteConfirmDialogComponent, {
      width: '400px',
      data: { name: metric.name }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.deleteMetric(metric.id);
      }
    });
  }

  createMetric(data: Partial<MetricCatalog>): void {
    this.loading = true;
    this.metricCatalogService.createMetric(data).subscribe({
      next: () => {
        console.log('Metric created successfully');
        this.loadMetrics();
        this.loadGroups();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to create metric:', error);
        alert('Ошибка при создании метрики: ' + (error.error || error.message));
        this.loading = false;
      }
    });
  }

  updateMetric(id: string, data: Partial<MetricCatalog>): void {
    this.loading = true;
    this.metricCatalogService.updateMetric(id, data).subscribe({
      next: () => {
        console.log('Metric updated successfully');
        this.loadMetrics();
        this.loadGroups();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to update metric:', error);
        alert('Ошибка при обновлении метрики: ' + (error.error || error.message));
        this.loading = false;
      }
    });
  }

  deleteMetric(id: string): void {
    this.loading = true;
    this.metricCatalogService.deleteMetric(id).subscribe({
      next: () => {
        console.log('Metric deleted successfully');
        this.loadMetrics();
        this.loadGroups();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to delete metric:', error);
        alert('Ошибка при удалении метрики: ' + (error.error || error.message));
        this.loading = false;
      }
    });
  }

  openDialog() {
    const dialogRef = this.dialog.open(KpiDialogComponent, {
      width: '550px',
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }
}

// Metric Create/Edit Dialog Component
@Component({
  selector: 'app-metric-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.metric ? 'Редактировать метрику' : 'Создать метрику' }}</h2>
    <mat-dialog-content style="min-width: 500px; padding: 20px;">
      <form [formGroup]="form" style="display: flex; flex-direction: column;">
        <mat-form-field appearance="outline" style="width: 100%; margin-bottom: 10px;">
          <mat-label>Имя метрики</mat-label>
          <input matInput formControlName="name" required>
          <mat-error *ngIf="form.get('name')?.hasError('required')">Имя обязательно</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width: 100%; margin-bottom: 10px;">
          <mat-label>Группа</mat-label>
          <input matInput formControlName="group" [matAutocomplete]="auto">
          <mat-autocomplete #auto="matAutocomplete">
            <mat-option *ngFor="let group of data.groups" [value]="group">
              {{ group }}
            </mat-option>
          </mat-autocomplete>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width: 100%; margin-bottom: 10px;">
          <mat-label>Единица измерения</mat-label>
          <mat-select formControlName="unit">
            <mat-option [value]="''">-</mat-option>
            <mat-option *ngFor="let unit of unitOptions" [value]="unit">{{ unit }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width: 100%; margin-bottom: 10px;">
          <mat-label>Направление ухудшения</mat-label>
          <mat-select formControlName="degradation">
            <mat-option [value]="''">-</mat-option>
            <mat-option value="higher">Higher (выше)</mat-option>
            <mat-option value="lower">Lower (ниже)</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width: 100%; margin-bottom: 10px;">
          <mat-label>Критический порог</mat-label>
          <input matInput formControlName="threshold_critical" placeholder="например: > 95 или < -120">
          <mat-hint>Укажите порог для критических оповещений</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width: 100%; margin-bottom: 10px;">
          <mat-label>Предупреждающий порог</mat-label>
          <input matInput formControlName="threshold_warning" placeholder="например: > 85 или < -110">
          <mat-hint>Укажите порог для предупреждающих оповещений</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" style="padding: 0 20px 20px 20px;">
      <button mat-button (click)="onCancel()">Отмена</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!form.valid">Сохранить</button>
    </mat-dialog-actions>
  `,
})
export class MetricDialogComponent implements OnInit {
  form: FormGroup;
  
  unitOptions: string[] = [
    'index',
    'J/bit',
    'ms',
    'users/km²',
    'Mbps/W',
    'messages/s',
    'bps/Hz/cell',
    'seconds',
    'count',
    '%',
    'dBm',
    'km',
    'dB',
    'GB',
    'km²',
    'Mbps/km²',
    'bps/Hz',
    'ratio',
    'W',
    'Gbps',
    'devices/km²',
    'score',
    'Mbps'
  ];

  constructor(
    public dialogRef: MatDialogRef<MetricDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { metric: MetricCatalog | null, groups: string[] },
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [this.data.metric?.name || '', Validators.required],
      group: [this.data.metric?.group || ''],
      unit: [this.data.metric?.unit || ''],
      degradation: [this.data.metric?.degradation || ''],
      threshold_critical: [this.data.metric?.threshold_critical || ''],
      threshold_warning: [this.data.metric?.threshold_warning || ''],
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}

// Delete Confirmation Dialog
@Component({
  selector: 'app-delete-confirm-dialog',
  template: `
    <h2 mat-dialog-title>Подтвердите удаление</h2>
    <mat-dialog-content>
      <p>Вы уверены, что хотите удалить метрику <strong>{{ data.name }}</strong>?</p>
      <p style="color: #f44336;">Это действие необратимо.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Отмена</button>
      <button mat-raised-button color="warn" (click)="onConfirm()">Удалить</button>
    </mat-dialog-actions>
  `,
})
export class DeleteConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { name: string }
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}

// KPI Dialog Component (kept for compatibility)
@Component({
  selector: 'app-kpi-dialog',
  styleUrls: ['./metric-catalog.component.css'],
  templateUrl: './dialog.component.html',
})
export class KpiDialogComponent implements OnInit{
  constructor(
    public dialogRef: MatDialogRef<KpiDialogComponent>,
    private readonly fb: FormBuilder,
  ) {}

  form: FormGroup;

  ngOnInit() {
    this.form = this.initForm();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  handleFormSubmit(): void {
    const value = this.form.value;
    console.log(value);
    console.log(this.form.value);
  }

  private initForm() {
    return this.fb.group({
      name: this.fb.control(''),
      type: this.fb.control(''),
      valuetype: this.fb.control(''),
      unit: this.fb.control(''),
      degradation: this.fb.control(''),
      threshold: this.fb.control(''),
      formula: this.fb.control(''),
    });
  }
}
