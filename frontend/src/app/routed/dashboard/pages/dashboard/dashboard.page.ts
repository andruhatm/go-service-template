import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardService, Dashboard, Widget, DashboardData } from '../../services/dashboard.service';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { MatDialog } from '@angular/material/dialog';
import { AddWidgetDialogComponent } from '../../components/add-widget-dialog/add-widget-dialog.component';
import { GridsterConfig, GridsterItem } from 'angular-gridster2';

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

  // Gridster configuration
  gridsterOptions: GridsterConfig = {
    gridType: 'fit',
    displayGrid: 'onDrag&Resize',
    pushItems: true,
    draggable: {
      enabled: true
    },
    resizable: {
      enabled: true
    },
    minCols: 12,
    maxCols: 12,
    minRows: 1,
    maxRows: 100,
    maxItemCols: 12,
    minItemCols: 2,
    maxItemRows: 100,
    minItemRows: 2,
    maxItemArea: 2500,
    minItemArea: 4,
    defaultItemCols: 6,
    defaultItemRows: 5,
    fixedRowHeight: 80, // Each row is 80px high
    fixedColWidth: 80,  // Each column is responsive
    margin: 10,
    outerMargin: true,
    outerMarginTop: 10,
    outerMarginRight: 10,
    outerMarginBottom: 10,
    outerMarginLeft: 10,
    itemChangeCallback: this.itemChange.bind(this),
    itemResizeCallback: this.itemResize.bind(this)
  };

  // Period and auto-refresh controls
  period: number = 3600; // Default 1 hour in seconds
  autoRefresh: boolean = false;
  refreshInterval: number = 60000; // 60 seconds in milliseconds
  showThresholds: boolean = false; // Show warning/error thresholds

  periodOptions = [
    { label: '15 минут', value: 900 },
    { label: '30 минут', value: 1800 },
    { label: '1 час', value: 3600 },
    { label: '3 часа', value: 10800 },
    { label: '6 часов', value: 21600 },
    { label: '12 часов', value: 43200 },
    { label: '24 часа', value: 86400 },
    { label: '1 месяц', value: 2592000 },
    { label: '3 месяца', value: 7776000 },
    { label: '6 месяцев', value: 15552000 }
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

        // Initialize settings if not present
        if (!this.dashboardData.settings) {
          this.dashboardData.settings = {
            period: 3600,
            autoRefresh: false,
            refreshInterval: 60000,
            showThresholds: false
          };
        }

        // Load settings into component properties
        this.period = this.dashboardData.settings.period || 3600;
        this.autoRefresh = this.dashboardData.settings.autoRefresh || false;
        this.refreshInterval = this.dashboardData.settings.refreshInterval || 60000;
        this.showThresholds = this.dashboardData.settings.showThresholds || false;

        // Initialize gridster properties for existing widgets if not present
        this.dashboardData.widgets = this.dashboardData.widgets.map(widget => {
          if (typeof widget.x === 'undefined') {
            // Convert old position format or assign defaults
            return {
              ...widget,
              x: widget.position?.x || 0,
              y: widget.position?.y || 0,
              cols: widget.position?.w || 6,
              rows: widget.position?.h || 4
            };
          }
          return widget;
        });
      } catch (e) {
        console.error('Error parsing dashboard data:', e);
        this.dashboardData = { 
          widgets: [], 
          layout: [],
          settings: {
            period: 3600,
            autoRefresh: false,
            refreshInterval: 60000,
            showThresholds: false
          }
        };
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
    // Update settings in dashboard data
    if (!this.dashboardData.settings) {
      this.dashboardData.settings = {};
    }
    this.dashboardData.settings.period = this.period;
    // Save to database
    this.saveDashboardDebounced();
  }

  onAutoRefreshChange(): void {
    console.log('Auto-refresh toggled:', this.autoRefresh);
    // Update settings in dashboard data
    if (!this.dashboardData.settings) {
      this.dashboardData.settings = {};
    }
    this.dashboardData.settings.autoRefresh = this.autoRefresh;
    // Save to database
    this.saveDashboardDebounced();
  }

  onRefreshIntervalChange(): void {
    console.log('Refresh interval changed to:', this.refreshInterval);
    // Update settings in dashboard data
    if (!this.dashboardData.settings) {
      this.dashboardData.settings = {};
    }
    this.dashboardData.settings.refreshInterval = this.refreshInterval;
    // Save to database
    this.saveDashboardDebounced();
  }

  onShowThresholdsChange(): void {
    console.log('Show thresholds toggled:', this.showThresholds);
    // Update settings in dashboard data
    if (!this.dashboardData.settings) {
      this.dashboardData.settings = {};
    }
    this.dashboardData.settings.showThresholds = this.showThresholds;
    // Save to database
    this.saveDashboardDebounced();
  }

  refreshAll(): void {
    // Force refresh all widgets by recreating them
    const widgets = [...this.dashboardData.widgets];
    this.dashboardData.widgets = [];
    setTimeout(() => {
      this.dashboardData.widgets = widgets;
    }, 0);
  }

  itemChange(item: GridsterItem): void {
    console.log('Item changed:', item);
    // Item position changed (dragged)
    this.saveDashboardDebounced();
  }

  itemResize(item: GridsterItem): void {
    console.log('Item resized:', item);
    // Item size changed
    this.saveDashboardDebounced();
  }

  private saveTimeout: any;
  private saveDashboardDebounced(): void {
    // Debounce save to avoid too many API calls during drag/resize
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveDashboard();
    }, 500);
  }
}
