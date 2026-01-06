import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardService, Dashboard, Widget, DashboardData } from '../../services/dashboard.service';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { MatDialog } from '@angular/material/dialog';
import { AddWidgetDialogComponent } from '../../components/add-widget-dialog/add-widget-dialog.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.css']
})
export class DashboardPage implements OnInit, OnDestroy {
  dashboard: Dashboard | null = null;
  dashboardData: DashboardData = { widgets: [], layout: [] };
  loading: boolean = true;
  error: string | null = null;
  userProfile: KeycloakProfile | null = null;
  userId: string | null = null;

  // Period and auto-refresh controls
  period: number = 3600; // Default 1 hour in seconds
  autoRefresh: boolean = false;
  refreshInterval: number = 60000; // 60 seconds in milliseconds

  periodOptions = [
    { label: '15 минут', value: 900 },
    { label: '30 минут', value: 1800 },
    { label: '1 час', value: 3600 },
    { label: '3 часа', value: 10800 },
    { label: '6 часов', value: 21600 },
    { label: '12 часов', value: 43200 },
    { label: '24 часа', value: 86400 }
  ];

  refreshIntervalOptions = [
    { label: '30 сек', value: 30000 },
    { label: '1 мин', value: 60000 },
    { label: '2 мин', value: 120000 },
    { label: '5 мин', value: 300000 },
    { label: '10 мин', value: 600000 }
  ];

  constructor(
    private dashboardService: DashboardService,
    private keycloakService: KeycloakService,
    private dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // Get current user profile
      this.userProfile = await this.keycloakService.loadUserProfile();
      this.userId = this.userProfile?.id || null;

      if (this.userId) {
        // Get or create dashboard for the user
        this.dashboardService.getOrCreateDashboard(this.userId).subscribe({
          next: (dashboard) => {
            this.dashboard = dashboard;
            this.parseDashboardData();
            this.loading = false;
            console.log('Dashboard loaded:', dashboard);
          },
          error: (error) => {
            console.error('Error loading dashboard:', error);
            this.error = 'Failed to load dashboard. Please try again later.';
            this.loading = false;
          }
        });
      } else {
        this.error = 'User ID not found. Please log in again.';
        this.loading = false;
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      this.error = 'Failed to load user profile. Please log in again.';
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  parseDashboardData(): void {
    if (this.dashboard && this.dashboard.data) {
      try {
        // If data is a string, parse it
        if (typeof this.dashboard.data === 'string') {
          this.dashboardData = JSON.parse(this.dashboard.data);
        } else {
          this.dashboardData = this.dashboard.data;
        }
        
        // Ensure widgets array exists
        if (!this.dashboardData.widgets) {
          this.dashboardData.widgets = [];
        }
      } catch (e) {
        console.error('Error parsing dashboard data:', e);
        this.dashboardData = { widgets: [], layout: [] };
      }
    }
  }

  openAddWidgetDialog(): void {
    const dialogRef = this.dialog.open(AddWidgetDialogComponent, {
      width: '500px',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addWidget(result);
      }
    });
  }

  addWidget(widget: Widget): void {
    this.dashboardData.widgets.push(widget);
    this.saveDashboard();
  }

  removeWidget(widgetId: string): void {
    this.dashboardData.widgets = this.dashboardData.widgets.filter(w => w.id !== widgetId);
    this.saveDashboard();
  }

  onRemoveWidget(widget: Widget): void {
    this.removeWidget(widget.id);
  }

  saveDashboard(): void {
    if (!this.dashboard) return;

    this.dashboardService.updateDashboard(this.dashboard.id, {
      data: this.dashboardData
    }).subscribe({
      next: (updatedDashboard) => {
        this.dashboard = updatedDashboard;
        console.log('Dashboard saved successfully');
      },
      error: (error) => {
        console.error('Error saving dashboard:', error);
        this.error = 'Failed to save dashboard.';
      }
    });
  }

  onPeriodChange(): void {
    console.log('Period changed to:', this.period);
    // Widgets will automatically pick up the new period value
  }

  onAutoRefreshChange(): void {
    console.log('Auto-refresh toggled:', this.autoRefresh);
    // Widgets will automatically pick up the new auto-refresh value
  }

  onRefreshIntervalChange(): void {
    console.log('Refresh interval changed to:', this.refreshInterval);
    // Widgets will automatically pick up the new refresh interval
  }

  refreshAll(): void {
    // Force refresh all widgets by recreating them
    const widgets = [...this.dashboardData.widgets];
    this.dashboardData.widgets = [];
    setTimeout(() => {
      this.dashboardData.widgets = widgets;
    }, 0);
  }
}
