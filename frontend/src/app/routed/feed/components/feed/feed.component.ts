import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { KeycloakService } from 'keycloak-angular';
import { MonObjectService } from '../../../../features/mon-objects/services/mon-object.service';
import { MonObject } from '../../../../features/mon-objects/models/mon-object.model';
import { MonObjectDialogComponent } from '../mon-object-dialog/mon-object-dialog.component';

export interface CategoryFilter {
  nameCategory: string;
  type?: string;
}

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.sass']
})
export class FeedComponent implements OnInit {
  // Table columns configuration
  columns = [
    {
      columnDef: 'name',
      header: 'Имя',
      cell: (element: MonObject) => element.name || '',
    },
    {
      columnDef: 'type',
      header: 'Тип',
      cell: (element: MonObject) => element.type || '',
    },
    {
      columnDef: 'technology',
      header: 'Технология',
      cell: (element: MonObject) => element.technology || '',
    },
    {
      columnDef: 'platform',
      header: 'Платформа',
      cell: (element: MonObject) => element.platform || '',
    },
    {
      columnDef: 'network',
      header: 'Сеть',
      cell: (element: MonObject) => element.network || '',
    },
    {
      columnDef: 'manufacturer',
      header: 'Производитель',
      cell: (element: MonObject) => element.manufacturer || '',
    },
  ];

  // Data and display
  dataSource: MonObject[] = [];
  displayedColumns: string[] = [];
  
  // User and permissions
  isLoggedIn = false;
  isAdmin = false;
  isMonitor = false;
  
  // Pagination
  page = 1;
  pageSize = 20;
  totalPages = 1;
  totalItems = 0;
  
  // Filters
  categories: CategoryFilter[] = [];
  selectedType = '';
  searchTerm = '';
  
  // UI State
  loading = false;
  isEmptyResponse = false;
  title = 'Объекты мониторинга';

  constructor(
    private readonly monObjectService: MonObjectService,
    private readonly keycloakService: KeycloakService,
    public dialog: MatDialog
  ) {}

  async ngOnInit() {
    // Initialize categories for filtering
    this.categories = [
      { nameCategory: 'Все объекты', type: '' },
      { nameCategory: 'eNodeB', type: 'eNodeB' },
      { nameCategory: 'gNodeB', type: 'gNodeB' },
      { nameCategory: 'Роутеры', type: 'router' },
      { nameCategory: 'Коммутаторы', type: 'switch' },
      { nameCategory: 'Серверы', type: 'server' },
      { nameCategory: 'Соты', type: 'cell' },
      { nameCategory: 'RRU', type: 'rru' },
      { nameCategory: 'CU', type: 'cu' },
      { nameCategory: 'DU', type: 'du' },
    ];

    try {
      // Check authentication - same pattern as app.component.ts
      this.isLoggedIn = await this.keycloakService.isLoggedIn();
      
      console.log('Feed Component - isLoggedIn:', this.isLoggedIn);
      
      if (this.isLoggedIn) {
        // Wrap role checks in try-catch
        try {
          this.isAdmin = this.keycloakService.isUserInRole('ROLE_ADMIN');
          this.isMonitor = this.keycloakService.isUserInRole('ROLE_MONITOR');
        } catch (roleError) {
          console.warn('Feed Component - Error checking roles:', roleError);
          // Fallback: check roles from token directly
          try {
            const roles = this.keycloakService.getUserRoles();
            this.isAdmin = roles.includes('ROLE_ADMIN');
            this.isMonitor = roles.includes('ROLE_MONITOR');
          } catch (e) {
            console.error('Feed Component - Cannot get roles:', e);
            this.isAdmin = false;
            this.isMonitor = false;
          }
        }
        
        console.log('Feed Component - isAdmin:', this.isAdmin);
        console.log('Feed Component - isMonitor:', this.isMonitor);
        
        const userProfile = await this.keycloakService.loadUserProfile();
        console.log('Feed Component - Username:', userProfile.username);
        
        try {
          console.log('Feed Component - All roles:', this.keycloakService.getUserRoles());
        } catch (e) {
          console.log('Feed Component - Could not get roles list');
        }
      } else {
        this.isAdmin = false;
        this.isMonitor = false;
      }
    } catch (error) {
      console.error('Feed Component - Error in ngOnInit:', error);
      this.isLoggedIn = false;
      this.isAdmin = false;
      this.isMonitor = false;
    }
    
    // Set displayed columns based on role
    this.updateDisplayedColumns();
    
    // Load data
    this.loadMonObjects();
  }

  updateDisplayedColumns(): void {
    this.displayedColumns = this.columns.map(c => c.columnDef);
    
    // Add actions column for admin users
    if (this.isAdmin) {
      this.displayedColumns.push('actions');
    }
  }

  loadMonObjects(): void {
    this.loading = true;
    this.isEmptyResponse = false;

    this.monObjectService.listMonObjects({
      page: this.page,
      pageSize: this.pageSize,
      type: this.selectedType || undefined,
      name: this.searchTerm || undefined
    }).subscribe({
      next: (response) => {
        this.dataSource = response.items;
        this.totalPages = response.totalPages;
        this.totalItems = response.total;
        this.isEmptyResponse = response.items.length === 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load monitoring objects:', error);
        this.loading = false;
        this.isEmptyResponse = true;
        
        if (error.status === 401) {
          console.warn('Not authenticated - showing read-only view');
          // Don't show alert for 401 in development mode
        } else if (error.status === 403) {
          alert('Доступ запрещен');
        } else if (error.status === 0) {
          alert('Не удается подключиться к серверу. Убедитесь, что backend запущен на localhost:8081');
        } else {
          alert('Ошибка загрузки данных: ' + (error.error || error.message || 'Неизвестная ошибка'));
        }
      }
    });
  }

  handleCategoryClick(category: CategoryFilter): void {
    this.selectedType = category.type || '';
    this.title = category.nameCategory;
    this.page = 1;
    this.loadMonObjects();
  }

  onSearch(searchValue: string): void {
    this.searchTerm = searchValue;
    this.page = 1;
    this.loadMonObjects();
  }

  // Pagination methods
  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadMonObjects();
    }
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadMonObjects();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.page = page;
      this.loadMonObjects();
    }
  }

  // CRUD operations (Admin only)
  openCreateDialog(): void {
    if (!this.isAdmin) return;

    const dialogRef = this.dialog.open(MonObjectDialogComponent, {
      width: '600px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createMonObject(result);
      }
    });
  }

  openEditDialog(obj: MonObject): void {
    if (!this.isAdmin) return;

    const dialogRef = this.dialog.open(MonObjectDialogComponent, {
      width: '600px',
      data: { mode: 'edit', object: obj }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateMonObject(obj.id, result);
      }
    });
  }

  openViewDialog(obj: MonObject): void {
    const dialogRef = this.dialog.open(MonObjectDialogComponent, {
      width: '600px',
      data: { mode: 'view', object: obj }
    });
  }

  createMonObject(data: any): void {
    this.loading = true;
    this.monObjectService.createMonObject(data).subscribe({
      next: (created) => {
        console.log('Created:', created);
        alert('Объект успешно создан');
        this.loadMonObjects();
      },
      error: (error) => {
        console.error('Failed to create:', error);
        this.loading = false;
        alert('Ошибка создания: ' + (error.error || error.message));
      }
    });
  }

  updateMonObject(id: string, data: any): void {
    this.loading = true;
    this.monObjectService.updateMonObject(id, data).subscribe({
      next: (updated) => {
        console.log('Updated:', updated);
        alert('Объект успешно обновлен');
        this.loadMonObjects();
      },
      error: (error) => {
        console.error('Failed to update:', error);
        this.loading = false;
        alert('Ошибка обновления: ' + (error.error || error.message));
      }
    });
  }

  deleteMonObject(obj: MonObject): void {
    if (!this.isAdmin) return;

    if (confirm(`Вы уверены, что хотите удалить "${obj.name}"?`)) {
      this.loading = true;
      this.monObjectService.deleteMonObject(obj.id).subscribe({
        next: () => {
          console.log('Deleted:', obj.id);
          alert('Объект успешно удален');
          this.loadMonObjects();
        },
        error: (error) => {
          console.error('Failed to delete:', error);
          this.loading = false;
          alert('Ошибка удаления: ' + (error.error || error.message));
        }
      });
    }
  }

  // Helper method to get cell value
  getCellValue(column: any, row: MonObject): string {
    return column.cell(row);
  }

  // Login method
  login(): void {
    this.keycloakService.login({
      redirectUri: window.location.href
    });
  }
}
