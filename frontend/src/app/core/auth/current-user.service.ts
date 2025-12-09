import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpBackend, HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NewUser } from '../../features/users/models/new-user.model';
import { Router } from '@angular/router';
import { Role } from './role.model';
import { Anonymous, CurrentUser, LoggedUser } from './current-user.model';

import { ExistingUser } from '../../features/users/models/existing-user.model';

import {CountryModel} from '../../features/other-model/country.model';
import {CityModel} from '../../features/other-model/city.model';

export interface ApiProfile {
  username: string;
  roles: [Role];
}

export class AnonymousUserImpl implements Anonymous {
  readonly authenticated: false = false;

  // @ts-ignore
  hasRole(role: Role): boolean {
    return false;
  }
}

export class CurrentUserImpl implements LoggedUser {
  authenticated: true = true;
  readonly userId = this.profile.userId;
  readonly username = this.profile.username;
  readonly email = this.profile.email;
  readonly firstName = this.profile.firstName;
  readonly lastName = this.profile.lastName;
  readonly informationAboutYourself = this.profile.informationAboutYourself;
  readonly categories = this.profile.categories;

  public roles: Set<Role> = new Set(this.profile.roles);

  constructor(readonly profile: ExistingUser) {}

  hasRole(role: Role): boolean {
    return this.roles.has(role);
  }
}

@Injectable({
  providedIn: 'root'
})
export class CurrentUserService {
  readonly user$ = new BehaviorSubject<CurrentUser>(new AnonymousUserImpl());
  private http: HttpClient;

  constructor(private httpClient: HttpBackend, private router: Router, private getUserService: CurrentUserService) {
    this.http = new HttpClient(httpClient);
    console.log('Current User created');
  }

  login(email: string, password: string): Observable<void> {
    const data = {
      email,
      password
    };
    return this.http.post<void>(`${environment.api}/security/login`, data);
  }

  logout(): Observable<void> {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    // this.user$.next(undefined);

    return this.http
      .post<void>(`${environment.api}/security/logout`, undefined)
      .pipe(tap(() => this.user$.next(new AnonymousUserImpl())));
  }

  createUser(
    username: string,
    password: string,
    firstName: string,
    lastName: string,
    email: string,
    // id_photo: string,
    country: CountryModel,
    cityDTO: CityModel
  ): Observable<void> {
    const data: NewUser = {
      username,
      password,
      firstName,
      lastName,
      email,
      country,
      cityDTO
    };
    return this.http.post<void>(`${environment.api}/user/`, data).pipe(
      catchError((err) => {
        console.log('error caught in service');
        return throwError(err);
      })
    );
  }

  setUser(profile: ExistingUser | undefined): void {
    if (profile == undefined) {
      this.user$.next(new AnonymousUserImpl());
    } else {
      this.user$.next(new CurrentUserImpl(profile));
    }
  }

  getAuth(code: string, uuid: string | undefined): Observable<any> {
    const body = { code, uuid };
    return this.http.post(`api/auth/code`, body, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  getUuid(): string | null {
    const req = new XMLHttpRequest();
    // @ts-ignore
    req.open('GET', document.location, false);
    req.send(null);
    return req.getResponseHeader('Uuid');
  }

  logIn(): boolean {
    return localStorage.getItem('auth_token') !== null;
  }
}
