
# Monitoring Objects Module

This module provides Angular services and models for working with monitoring objects in the backend API.

## Files

- **models/mon-object.model.ts** - TypeScript interfaces for monitoring objects
- **services/mon-object.service.ts** - Service for CRUD operations on monitoring objects
- **mon-objects.module.ts** - Angular module definition

## Usage

### 1. Import the Module

Add `MonObjectsModule` to your app module or feature module:

```typescript
import { MonObjectsModule } from './features/mon-objects/mon-objects.module';

@NgModule({
  imports: [
    // ... other imports
    MonObjectsModule
  ]
})
export class AppModule { }
```

### 2. Inject the Service

```typescript
import { Component, OnInit } from '@angular/core';
import { MonObjectService } from './features/mon-objects/services/mon-object.service';
import { MonObject, CreateMonObjectRequest } from './features/mon-objects/models/mon-object.model';

@Component({
  selector: 'app-mon-objects-list',
  templateUrl: './mon-objects-list.component.html'
})
export class MonObjectsListComponent implements OnInit {
  monObjects: MonObject[] = [];
  
  constructor(private monObjectService: MonObjectService) {}
  
  ngOnInit() {
    this.loadMonObjects();
  }
  
  loadMonObjects() {
    this.monObjectService.listMonObjects({ page: 1, pageSize: 20 })
      .subscribe({
        next: (response) => {
          this.monObjects = response.items;
          console.log(`Loaded ${response.total} monitoring objects`);
        },
        error: (error) => {
          console.error('Failed to load monitoring objects', error);
        }
      });
  }
}
```

### 3. Create a New Object

```typescript
createMonObject() {
  const newObject: CreateMonObjectRequest = {
    name: 'Router-Core-01',
    type: 'router',
    technology: 'Cisco IOS-XE',
    platform: 'Catalyst 9000',
    network: 'Core Network',
    manufacturer: 'Cisco Systems'
  };
  
  this.monObjectService.createMonObject(newObject)
    .subscribe({
      next: (created) => {
        console.log('Created:', created);
        this.loadMonObjects(); // Refresh list
      },
      error: (error) => {
        console.error('Failed to create:', error);
      }
    });
}
```

### 4. Update an Object

```typescript
updateMonObject(id: string) {
  const updates = {
    name: 'Router-Core-01-Updated',
    platform: 'ASR 9000'
  };
  
  this.monObjectService.updateMonObject(id, updates)
    .subscribe({
      next: (updated) => {
        console.log('Updated:', updated);
      },
      error: (error) => {
        console.error('Failed to update:', error);
      }
    });
}
```

### 5. Delete an Object

```typescript
deleteMonObject(id: string) {
  if (confirm('Are you sure you want to delete this object?')) {
    this.monObjectService.deleteMonObject(id)
      .subscribe({
        next: () => {
          console.log('Deleted successfully');
          this.loadMonObjects(); // Refresh list
        },
        error: (error) => {
          console.error('Failed to delete:', error);
        }
      });
  }
}
```

### 6. Search and Filter

```typescript
// Search by name
searchMonObjects(searchTerm: string) {
  this.monObjectService.searchByName(searchTerm)
    .subscribe({
      next: (response) => {
        this.monObjects = response.items;
      }
    });
}

// Filter by type
filterByType(type: string) {
  this.monObjectService.getByType(type)
    .subscribe({
      next: (response) => {
        this.monObjects = response.items;
      }
    });
}

// Custom filters
loadWithFilters() {
  this.monObjectService.listMonObjects({
    page: 1,
    pageSize: 50,
    type: 'router',
    technology: 'Cisco',
    name: 'core'
  }).subscribe({
    next: (response) => {
      this.monObjects = response.items;
      console.log(`Found ${response.total} matching objects`);
    }
  });
}
```

## API Endpoints

The service connects to these backend endpoints:

- **POST** `/api/mon-objects` - Create new object
- **GET** `/api/mon-objects` - List objects (paginated, with filters)
- **GET** `/api/mon-objects/{id}` - Get object by ID
- **PUT** `/api/mon-objects/{id}` - Update object
- **DELETE** `/api/mon-objects/{id}` - Delete object

## Authentication

The service automatically includes the Bearer token from `localStorage.getItem('access_token')` in all requests.

Make sure your authentication service stores the token after successful login:

```typescript
// After successful Keycloak authentication
localStorage.setItem('access_token', tokenResponse.access_token);
```

## Error Handling

All service methods return Observables. Handle errors appropriately:

```typescript
this.monObjectService.getMonObject(id)
  .subscribe({
    next: (obj) => {
      // Success
    },
    error: (error) => {
      if (error.status === 404) {
        console.error('Object not found');
      } else if (error.status === 401) {
        console.error('Authentication required');
        // Redirect to login
      } else {
        console.error('An error occurred:', error);
      }
    }
  });
```

## Complete Example Component

```typescript
import { Component, OnInit } from '@angular/core';
import { MonObjectService } from './features/mon-objects/services/mon-object.service';
import { MonObject, MonObjectListResponse } from './features/mon-objects/models/mon-object.model';

@Component({
  selector: 'app-mon-objects-manager',
  template: `
    <div class="mon-objects-container">
      <h2>Monitoring Objects</h2>
      
      <div class="filters">
        <input [(ngModel)]="searchTerm" placeholder="Search by name" (input)="onSearch()">
        <select [(ngModel)]="selectedType" (change)="onTypeChange()">
          <option value="">All Types</option>
          <option value="router">Routers</option>
          <option value="switch">Switches</option>
          <option value="server">Servers</option>
        </select>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Technology</th>
            <th>Platform</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let obj of monObjects">
            <td>{{ obj.name }}</td>
            <td>{{ obj.type }}</td>
            <td>{{ obj.technology }}</td>
            <td>{{ obj.platform }}</td>
            <td>
              <button (click)="editObject(obj)">Edit</button>
              <button (click)="deleteObject(obj.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="pagination">
        <button [disabled]="currentPage === 1" (click)="previousPage()">Previous</button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <button [disabled]="currentPage === totalPages" (click)="nextPage()">Next</button>
      </div>
    </div>
  `
})
export class MonObjectsManagerComponent implements OnInit {
  monObjects: MonObject[] = [];
  currentPage = 1;
  pageSize = 20;
  totalPages = 1;
  searchTerm = '';
  selectedType = '';
  
  constructor(private monObjectService: MonObjectService) {}
  
  ngOnInit() {
    this.loadMonObjects();
  }
  
  loadMonObjects() {
    this.monObjectService.listMonObjects({
      page: this.currentPage,
      pageSize: this.pageSize,
      name: this.searchTerm || undefined,
      type: this.selectedType || undefined
    }).subscribe({
      next: (response: MonObjectListResponse) => {
        this.monObjects = response.items;
        this.totalPages = response.totalPages;
      },
      error: (error) => console.error('Failed to load:', error)
    });
  }
  
  onSearch() {
    this.currentPage = 1;
    this.loadMonObjects();
  }
  
  onTypeChange() {
    this.currentPage = 1;
    this.loadMonObjects();
  }
  
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadMonObjects();
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadMonObjects();
    }
  }
  
  editObject(obj: MonObject) {
    // Implement edit functionality
    console.log('Edit:', obj);
  }
  
  deleteObject(id: string) {
    if (confirm('Delete this object?')) {
      this.monObjectService.deleteMonObject(id).subscribe({
        next: () => this.loadMonObjects(),
        error: (error) => console.error('Failed to delete:', error)
      });
    }
  }
}
```

## Backend Documentation

For complete API documentation, see: `go-api/docs/MON_OBJECTS_API.md`

