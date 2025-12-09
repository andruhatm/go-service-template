import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UserRole } from '../models/user-role.model';
import { catchError } from 'rxjs/operators';
import { ExistingUser } from '../models/existing-user.model';
import { EventCategory } from '../../other-model/category.model';
import { CountryModel } from '../../other-model/country.model';
import { CityModel } from '../../other-model/city.model';
import { AnotherUser } from '../models/another-user.model';
import { PayInformationModel } from '../../other-model/payInformation.model';
import { LoginFormData } from '../../form/login.form.model';
import { CurrentUserService } from '../../../core/auth/current-user.service';
import { Router } from '@angular/router';
import {MinimalInformationUser} from "../models/minimal-information-user.model";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly currentUserService: CurrentUserService
  ) {}

  getAllUsers(): Observable<ExistingUser[]> {
    return this.http.get<ExistingUser[]>(`${environment.api}/user/`);
  }

  login(value: LoginFormData): void {
    console.log(value);
    // this.error = false;
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
          //this.error = true;
        }
      );
    // switchMap(() => this.getUserService.refreshCurrentUser());
  }

  getUserById(id: number): Observable<ExistingUser> {
    return this.http.get<ExistingUser>(`${environment.api}/user/${id}`);
  }

  getAnotherUserById(id: number): Observable<AnotherUser> {
    return this.http.get<AnotherUser>(`${environment.api}/user/${id}`);
  }

  getMinimalInformationUserById(id: string): Observable<MinimalInformationUser> {
    return this.http.get<MinimalInformationUser>(`${environment.api}/user/${id}`);
  }


  deleteUserById(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.api}/user/${id}`);
  }

  patchCategories(data: string[]): Observable<EventCategory[]> {
    const categories: EventCategory[] = [];
    for (let datum of data) {
      categories.push({
        nameCategory: datum
      });
    }
    console.log(categories);

    return this.http
      .patch<EventCategory[]>(`${environment.api}/user/${localStorage.getItem('user_id')}/categories`, categories)
      .pipe(
        catchError((err) => {
          console.log('error caught in service');
          console.error(err);
          return throwError(err);
        })
      );
  }

  createUserAsAdmin(
    username: string,
    password: string,
    role: UserRole,
    firstName: string,
    lastName: string,
    phone: string,
    email: string
  ): Observable<void> {
    const data = {
      username,
      password,
      role,
      personalInfo: {
        firstName,
        lastName,
        phone,
        email
      }
    };
    return this.http.post<void>(`${environment.api}/public/reg`, data);
  }

  editUserAsAdmin(
    id: number,
    password: string,
    role: UserRole,
    isActive: boolean,
    isLocked: boolean,
    firstName: string,
    lastName: string,
    phone: string,
    email: string
  ): Observable<void> {
    const data = {
      password,
      role,
      status: {
        isActive,
        isLocked
      },
      personalInfo: {
        firstName,
        lastName,
        phone,
        email
      }
    };
    return this.http.put<void>(`${environment.api}/users/${id}`, data);
  }

  editUserAsUser(
    id: number,
    password: string,
    role: UserRole,
    firstName: string,
    lastName: string,
    phone: string,
    email: string
  ): Observable<void> {
    const data = {
      role,
      personalInfo: {
        firstName,
        lastName,
        phone,
        email
      },
      password,
      status: {
        isActive: true,
        isLocked: false
      }
    };
    console.log(id, data);
    return this.http.put<void>(`${environment.api}/users/${id}`, data);
  }

  // getAdmins(): Observable<ExistingUser[]> {
  //   return this.getAllUsers().pipe(
  //     map((users) => {
  //       return users.filter((user) => user.role === UserRole.ADMIN);
  //     })
  //   );
  // }

  deleteMember(userId: number, groupId: number): Observable<void> {
    return this.http.delete<void>(`${environment.api}/groups/${groupId}/users/${userId}`);
  }

  updateUser(
    firstName: string,
    lastName: string,
    email: string,
    country: CountryModel,
    informationAboutYourself: string,
    username: string,
    cityDTO: CityModel,
    categories: string[]
  ): Observable<void> {
    const categoriesList: EventCategory[] = [];
    for (const c of categories) {
      categoriesList.push({
        nameCategory: c
      });
    }
    const updateUser: ExistingUser = {
      firstName,
      lastName,
      email,
      country,
      informationAboutYourself,
      username,
      cityDTO,
      categories: categoriesList
    };
    console.log('put ' + updateUser.cityDTO);
    return this.http.put<void>(`${environment.api}/user/${localStorage.getItem('user_id')}`, updateUser).pipe(
      catchError((err) => {
        console.log('error caught in service');
        console.error(err);
        return throwError(err);
      })
    );
  }

  postPremium(createDate: string, status: string, emailAddress: string, value: string): Observable<ExistingUser> {
    const payInformation: PayInformationModel = {
      createDate: createDate,
      status: status,
      emailAddress: emailAddress,
      value: value
    };
    return this.http
      .post<ExistingUser>(`${environment.api}/user/${localStorage.getItem('user_id')}/premium`, payInformation)
      .pipe(
        catchError((err) => {
          console.log('error caught in service');
          console.error(err);
          return throwError(err);
        })
      );
  }

  deletedMedia(pk: string): Observable<void>{
    return this.http.delete<void>(`${environment.api}/media/${pk}`);
  }

  // async countOrganizerEvent() {
  //   return this.http.get<number>(`${environment.api}/user/${localStorage.getItem('user_id')}/countCreateEvent`).toPromise();
  // }
}
