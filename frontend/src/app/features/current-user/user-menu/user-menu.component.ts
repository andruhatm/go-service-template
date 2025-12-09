import { Component, OnInit, SimpleChanges } from '@angular/core';
import { CurrentUserService } from '../../../core/auth/current-user.service';
import { RefreshUserService } from '../../../core/auth/refresh-user.service';
import { Router } from '@angular/router';
import { LoggedUser } from '../../../core/auth/current-user.model';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.sass']
})
export class UserMenuComponent implements OnInit {
  user$ = this.currentUserService.user$;
  constructor(
    private readonly router: Router,
    private readonly getUserService: RefreshUserService,
    private readonly currentUserService: CurrentUserService
  ) {}

  ngOnInit(): void {}

  handleLogoutClick(): void {
    this.currentUserService.logout().subscribe(
      () => {
        this.router.navigate(['/auth/login']).then(() => window.location.reload());
      },
      (error) => console.error(error)
    );
  }
}
