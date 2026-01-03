# Keycloak Authentication Service Guide

## Overview

The `KeycloakAuthService` provides a centralized, reliable way to check user authentication and roles throughout the application. It solves timing issues that occur with lazy-loaded modules.

## Location

`src/app/core/auth/keycloak-auth.service.ts`

## How It Works

1. The service is initialized once in `AppComponent.ngOnInit()`
2. It caches the authentication state in a `BehaviorSubject`
3. All components can access the cached state synchronously or subscribe to changes

## Usage in Components

### Basic Usage (Synchronous)

```typescript
import { Component, OnInit } from '@angular/core';
import { KeycloakAuthService } from '../../../core/auth/keycloak-auth.service';

@Component({
  selector: 'app-my-component',
  templateUrl: './my-component.component.html'
})
export class MyComponent implements OnInit {
  isLoggedIn = false;
  isAdmin = false;
  isMonitor = false;

  constructor(private keycloakAuthService: KeycloakAuthService) {}

  ngOnInit() {
    // Get current authentication state synchronously
    const authState = this.keycloakAuthService.getCurrentAuthState();
    
    this.isLoggedIn = authState.isAuthenticated;
    this.isAdmin = authState.isAdmin;
    this.isMonitor = authState.isMonitor;
    
    console.log('User:', authState.username);
    console.log('Roles:', authState.roles);
  }

  // Or use convenience methods
  checkAccess() {
    if (this.keycloakAuthService.isAdmin()) {
      // Admin-only logic
    }
    
    if (this.keycloakAuthService.hasRole('ROLE_CUSTOM')) {
      // Custom role logic
    }
  }
}
```

### Reactive Usage (Subscribe to Changes)

```typescript
import { Component, OnInit } from '@angular/core';
import { KeycloakAuthService } from '../../../core/auth/keycloak-auth.service';

@Component({
  selector: 'app-my-component',
  templateUrl: './my-component.component.html'
})
export class MyComponent implements OnInit {
  isLoggedIn = false;
  isAdmin = false;
  username?: string;

  constructor(private keycloakAuthService: KeycloakAuthService) {}

  ngOnInit() {
    // Subscribe to authentication state changes
    this.keycloakAuthService.authState$.subscribe(authState => {
      this.isLoggedIn = authState.isAuthenticated;
      this.isAdmin = authState.isAdmin;
      this.username = authState.username;
    });
  }
}
```

### Template Usage

```html
<!-- Show content only for authenticated users -->
<div *ngIf="isLoggedIn">
  <p>Welcome {{ username }}!</p>
</div>

<!-- Show admin controls -->
<div *ngIf="isAdmin">
  <button (click)="deleteItem()">Delete</button>
  <button (click)="editItem()">Edit</button>
</div>

<!-- Show login button for anonymous users -->
<button *ngIf="!isLoggedIn" (click)="login()">Login</button>
```

## Available Methods

### Synchronous Methods

- `getCurrentAuthState()` - Get the complete authentication state
- `isAuthenticated()` - Check if user is logged in
- `isAdmin()` - Check if user has ROLE_ADMIN
- `isMonitor()` - Check if user has ROLE_MONITOR
- `hasRole(role: string)` - Check if user has a specific role
- `getUsername()` - Get the current username
- `getRoles()` - Get all user roles

### Authentication Actions

- `login()` - Redirect user to Keycloak login
- `logout()` - Log out the user

### Observable

- `authState$` - Observable that emits authentication state changes

## Auth State Interface

```typescript
interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMonitor: boolean;
  username?: string;
  roles: string[];
}
```

## Examples from the Codebase

### FeedComponent Example

See: `src/app/routed/feed/components/feed/feed.component.ts`

```typescript
ngOnInit() {
  // Get authentication state from the centralized service
  const authState = this.keycloakAuthService.getCurrentAuthState();
  this.isLoggedIn = authState.isAuthenticated;
  this.isAdmin = authState.isAdmin;
  this.isMonitor = authState.isMonitor;

  console.log('Feed Component - isLoggedIn:', this.isLoggedIn);
  console.log('Feed Component - isAdmin:', this.isAdmin);
  
  // Update UI based on roles
  this.updateDisplayedColumns();
  
  // Load data
  this.loadMonObjects();
}
```

### AppComponent Example

See: `src/app/app.component.ts`

The service is initialized in AppComponent to cache the authentication state:

```typescript
async ngOnInit() {
  // Initialize the auth service - this will cache the auth state
  await this.keycloakAuthService.initialize();

  // Subscribe to auth state changes
  this.keycloakAuthService.authState$.subscribe(authState => {
    this.isLoggedIn = authState.isAuthenticated;
    this.userAdmin = authState.isAdmin;
    this.username = authState.username;
  });
}
```

## Benefits

1. **Reliable** - No timing issues with lazy-loaded modules
2. **Centralized** - Single source of truth for authentication
3. **Simple** - Easy to use in any component
4. **Reactive** - Can subscribe to changes or get current state
5. **Type-safe** - Full TypeScript support

## Migration Guide

### Old Pattern (Don't use)

```typescript
// ❌ OLD - Has timing issues in lazy-loaded modules
async ngOnInit() {
  this.isLoggedIn = await this.keycloakService.isLoggedIn();
  this.isAdmin = this.keycloakService.isUserInRole('ROLE_ADMIN');
}
```

### New Pattern (Use this)

```typescript
// ✅ NEW - Works reliably everywhere
ngOnInit() {
  const authState = this.keycloakAuthService.getCurrentAuthState();
  this.isLoggedIn = authState.isAuthenticated;
  this.isAdmin = authState.isAdmin;
}
```

## Important Notes

1. **Initialization**: The service MUST be initialized in `AppComponent.ngOnInit()` before other components use it
2. **Lazy-loaded modules**: The service works perfectly in lazy-loaded modules because it caches the state
3. **Real-time updates**: If you need to react to authentication changes, subscribe to `authState$`
4. **Synchronous access**: For most cases, use `getCurrentAuthState()` for immediate, synchronous access

## Troubleshooting

### Issue: authState shows isAuthenticated: false even when logged in

**Solution**: Make sure `KeycloakAuthService.initialize()` is called in `AppComponent.ngOnInit()` and completes before routing to other components.

### Issue: Roles are empty

**Solution**: Check that your Keycloak client has the correct role mappings and that roles are included in the token.

### Issue: Component loads before auth state is ready

**Solution**: Either:
1. Use route guards to ensure auth is ready before navigation
2. Subscribe to `authState$` and update UI when state changes
3. Add `*ngIf="keycloakAuthService.authState$ | async as authState"` in template

