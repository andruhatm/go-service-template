# UI Compile Error - Troubleshooting Guide

## Quick Fix Checklist

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Clean Build
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or if that doesn't work
npm ci
```

### 3. Clear Angular Cache
```bash
rm -rf .angular
ng serve
```

### 4. Verify keycloak-angular Package
```bash
npm list keycloak-angular
```

Should show: `keycloak-angular@14.x.x` or similar

If not installed:
```bash
npm install keycloak-angular --save
```

## Common Errors and Fixes

### Error 1: "Cannot find module 'keycloak-angular'"

**Fix:**
```bash
npm install keycloak-angular --save
```

### Error 2: "Property 'isUserInRole' does not exist on type 'KeycloakService'"

**Cause**: Wrong version of keycloak-angular

**Fix:**
```bash
npm install keycloak-angular@latest --save
```

### Error 3: "Type 'Promise<void>' is not assignable to type 'void'"

**Issue**: ngOnInit is now async

**Fix**: Already applied in feed.component.ts:
```typescript
async ngOnInit(): Promise<void> {
  // ...
}
```

### Error 4: Module build errors

**Fix:**
```bash
ng build --configuration development
```

Check for specific errors in output.

## Verification Steps

### 1. Check TypeScript Version
```bash
npx tsc --version
```

Should be: `4.x` or `5.x`

### 2. Check Angular Version
```bash
ng version
```

### 3. Test Compile
```bash
ng build --configuration development
```

Should complete without errors.

### 4. Run Dev Server
```bash
ng serve
```

Open `http://localhost:4200` - should load without errors.

## If Still Having Issues

### Option A: Temporary Workaround

If you need to get it working quickly, revert the feed component to not use Keycloak:

**File: `feed.component.ts`**

Replace the import:
```typescript
// Remove this
import { KeycloakService } from 'keycloak-angular';

// Add this
import { CurrentUserImpl, CurrentUserService } from '../../../../core/auth/current-user.service';
```

Replace ngOnInit:
```typescript
// Change from async
ngOnInit(): void {
  // ... existing code
  this.currentUserService.user$.subscribe(user => {
    if (user.authenticated) {
      const currentUser = user as CurrentUserImpl;
      this.isAdmin = currentUser.hasRole('ROLE_ADMIN' as any);
      this.isMonitor = currentUser.hasRole('ROLE_MONITOR' as any);
    }
    this.updateDisplayedColumns();
    this.loadMonObjects();
  });
}
```

And update constructor:
```typescript
constructor(
  private readonly monObjectService: MonObjectService,
  private readonly currentUserService: CurrentUserService,
  public dialog: MatDialog
) {}
```

### Option B: Check Package.json

Your `package.json` should have:
```json
{
  "dependencies": {
    "@angular/animations": "^15.0.0",
    "@angular/common": "^15.0.0",
    "@angular/core": "^15.0.0",
    "keycloak-angular": "^14.0.0",
    // ... other deps
  }
}
```

## Most Common Issue: Missing Installation

**90% of compile errors are fixed by:**
```bash
cd frontend
npm install
ng serve
```

## Still Not Working?

### Share the exact error:

Run:
```bash
ng serve 2>&1 | tee compile-error.log
```

Then share the output from `compile-error.log`

Or just paste the error message that shows in terminal when you run `ng serve`.

## Package Installation Command

If keycloak-angular is missing:
```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template/frontend
npm install keycloak-angular --save
npm install
ng serve
```

## Debug Information

To get detailed error info:
```bash
ng serve --verbose
```

This will show exactly where the compilation is failing.

