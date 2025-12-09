import { Component, OnInit } from '@angular/core';
import { CurrentUserService } from '../../../../core/auth/current-user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, switchMap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { RefreshUserService } from '../../../../core/auth/refresh-user.service';
import { UserMenuComponent } from '../../../../features/current-user/user-menu/user-menu.component';
import { Title } from '@angular/platform-browser';
import { LoginFormData } from '../../../../features/form/login.form.model';

@Component({
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.sass']
})
export class LoginPage implements OnInit {
  error = false;
  color: '#f9bc64';

  content: string | undefined;
  url: string | undefined;

  constructor(
    private readonly currentUserService: CurrentUserService,
    private readonly getUserService: RefreshUserService,
    private readonly title: Title,
    private readonly router: Router,
    private route: ActivatedRoute
  ) {
    this.title.setTitle('Вход');
  }

  ngOnInit(): void {
    const code: string | null = this.route.snapshot.queryParamMap.get('code');

    if (code !== null) {
      this.currentUserService.getAuth(code, localStorage.getItem('UUID') as string).subscribe((authResponse) => {
        localStorage.setItem('auth_token', authResponse.token);
        localStorage.setItem('user_id', String(authResponse.userId));

        this.getUserService.refreshCurrentUser().subscribe();
        this.router.navigate(['/user']).then(() => {
          window.location.reload();
        });
      });
    } else {
      const uuid: string | null = this.currentUserService.getUuid();

      this.url =
        'http://34.65.28.190:9000/oauth2/authorization/vk?' +
        'redirect_uri=https://search-gift-frontend.herokuapp.com/login&uuid=' +
        uuid;

      if (typeof uuid === 'string') {
        localStorage.setItem('UUID', uuid);
      }
    }
  }

  handleFormSubmit(value: LoginFormData): void {
    console.log(value);
    this.error = false;
    this.currentUserService
      .login(value.email, value.password)
      // .pipe(switchMap(() => this.getUserService.refreshCurrentUser()))
      .subscribe(
        (response: any) => {
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('user_id', response.id);
          // this.token = response.token;
          console.log(response);
          this.router.navigate(['/feed']).then(() => window.location.reload());
        },
        (error) => {
          console.error('Error', error);
          this.error = true;
        }
      );
    // switchMap(() => this.getUserService.refreshCurrentUser());
  }
}
