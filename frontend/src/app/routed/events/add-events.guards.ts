import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import {Observable, of} from 'rxjs';
import {MatDialog} from "@angular/material/dialog";
import {DialogLimitationsPremComponent} from "../dialog/dialog-limitations-prem/dialog-limitations-prem.component";
import {CurrentUserImpl, CurrentUserService} from "../../core/auth/current-user.service";
import {DialogComponent} from "../dialog/dialog/dialog.component";
import {UserService} from "../../features/users/services/users.service";

export const MAX_NUMBER_FREE_EVENTS_CREATE = 2
@Injectable({ providedIn: 'root' })
export class AddEventsGuards implements CanActivate {
  user: CurrentUserImpl;
  count: number ;
  private route: ActivatedRouteSnapshot;
  private state: RouterStateSnapshot;
  constructor(private readonly currentUserService: CurrentUserService, private readonly router: Router, private readonly dialog: MatDialog,
              private readonly userService: UserService) {
    this.currentUserService.user$.subscribe((value: CurrentUserImpl) => {
      this.user = value;
    });
  }
  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ){
    this.route = route;
    this.state = state;
    // this.count = await this.userService.countOrganizerEvent()
    // console.log('count2 ' + this.count)
    // if (this.user.prem || this.count === null || this.count < MAX_NUMBER_FREE_EVENTS_CREATE) {
    return true;
    // } else {
    //   this.openDialog()
    // }
  }

  // public openDialog(){
  //   const dialogRef = this.dialog.open(DialogLimitationsPremComponent);
  //   dialogRef.afterClosed().subscribe(result => {
  //     if (result.toString() === ''){
  //       console.log("false")
  //       return this.router.navigate(['/feed'], {
  //         queryParams: {
  //           auth: false
  //         }
  //       });
  //     }
  //     else {
  //       console.log("true");
  //       return this.router.navigate(['/personal-cabinet','(prem:premium)']);
  //     }
  //   });
  // }
}
