import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatTableDataSource } from '@angular/material/table';
import { EmsService, Subs } from '../ems.service';

@Component({
  templateUrl: './events.page.html',
  styleUrls: ['./events.page.css']
})
export class EventsPage implements OnInit {
  dataSource = new MatTableDataSource<Subs>([]);
  displayedColumns = [
    'source_name',
    'connection_type',
    'host',
    'schedule',
    'enabled',
    'last_sync_status',
    'last_sync_at',
    'edit',
    'delete'
  ];

  constructor(
    private readonly router: Router,
    public titleStr: Title,
    private readonly emsService: EmsService
  ) {
    this.titleStr.setTitle('Подписки');
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    // Load data from backend API
    this.emsService.getAll().subscribe({
      next: (data) => {
        console.log('EMS sources loaded:', data);
        this.dataSource.data = data;
      },
      error: (err) => {
        console.error('Load EMS error', err);
        // Show empty table on error
        this.dataSource.data = [];
      }
    });
  }

  editCart(index: number): void {
    const item = this.dataSource.data[index];
    if (!item) { return; }
    // Передаём состояние при навигации (editMode + item)
    this.router.navigate(['/ems/add-ems'], { state: { editMode: true, item } });
  }

  removeCart(index: number): void {
    const item = this.dataSource.data[index];
    if (!item) { return; }

    // Простейшая подтверждалка. При желании замените на MatDialog.
    if (!confirm(`Удалить подписку "${item.source_name}"?`)) { return; }

    this.emsService.delete(item.id).subscribe({
      next: () => {
        // Удаляем локально из dataSource
        this.dataSource.data = this.dataSource.data.filter(d => d.id !== item.id);
      },
      error: (err) => {
        console.error('Delete error', err);
        // Здесь можно показать Snackbar/Alert
      }
    });
  }

  // Пример кнопки добавления, если нужно
  handleEventCreate(): void {
    this.router.navigate(['/ems/add-ems']);
  }

  getStatusIcon(status?: string): string {
    switch(status) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'pending': return '⏳';
      default: return '—';
    }
  }

  getStatusColor(status?: string): string {
    switch(status) {
      case 'success': return 'green';
      case 'error': return 'red';
      case 'pending': return 'orange';
      default: return 'gray';
    }
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleString('ru-RU');
  }
}
