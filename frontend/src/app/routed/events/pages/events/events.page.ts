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
    'description',
    'connection_type',
    'host',
    'FTPport',
    'file_path',
    'username',
    'password',
    'schedule',
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
    // Stub data for manual testing
    const stubData: Subs[] = [
      {
        id: 1,
        source_name: 'Test Source 1',
        description: 'Test subscription for FTP connection',
        connection_type: 'FTP',
        host: 'ftp.example.com',
        FTPport: '21',
        file_path: '/data/files',
        username: 'testuser1',
        password: 'password123',
        schedule: '0 0 * * *'
      },
      {
        id: 2,
        source_name: 'Test Source 2',
        description: 'Test subscription for SFTP connection',
        connection_type: 'SFTP',
        host: 'sftp.example.com',
        FTPport: '22',
        file_path: '/uploads/reports',
        username: 'testuser2',
        password: 'securepass456',
        schedule: '0 12 * * *'
      },
      {
        id: 3,
        source_name: 'Test Source 3',
        description: 'Test subscription for local file system',
        connection_type: 'LOCAL',
        host: 'localhost',
        FTPport: '0',
        file_path: '/var/data/input',
        username: '',
        password: '',
        schedule: '*/30 * * * *'
      }
    ];
    
    this.dataSource.data = stubData;
    
    // Uncomment below to use real API call
    // this.emsService.getAll().subscribe({
    //   next: (data) => this.dataSource.data = data,
    //   error: (err) => console.error('Load EMS error', err)
    // });
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
}
