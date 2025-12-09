import { Component, OnInit } from '@angular/core';
import { CurrentUserService } from '../../../../core/auth/current-user.service';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { userNameRegExp } from '../../../../features/validators/directives/username-validator.directive';
import { Title } from '@angular/platform-browser';
import { CountryModel } from '../../../../features/other-model/country.model';
import { CityModel } from '../../../../features/other-model/city.model';
import { map, startWith } from 'rxjs/operators';
import { CommonService } from '../../../../features/form/services/common.service';
import { Observable } from 'rxjs';
import {UserService} from "../../../../features/users/services/users.service";

interface SignUpFormData {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  country?: CountryModel;
  city?: CityModel;
}

export const A = 'users/default_photo/A_xvrose.svg';
export const B = 'users/default_photo/B_fpsobl.svg';
export const C = 'users/default_photo/C_yqvs3w.svg';
export const D = 'users/default_photo/D_utuzka.svg';
export const E = 'users/default_photo/E_cof4ki.svg';
export const F = 'users/default_photo/F_wfrgsc.svg';
export const G = 'users/default_photo/G_dkm4ha.svg';
export const H = 'users/default_photo/H_vvz2fw.svg';
export const I = 'users/default_photo/I_qwdw1r.svg';
export const J = 'users/default_photo/J_v8j7om.svg';
export const K = 'users/default_photo/K_wu4nnu.svg';
export const L = 'users/default_photo/L_j1bnpq.svg';
export const M = 'users/default_photo/M_hohrot.svg';
export const N = 'users/default_photo/N_wao6j1.svg';
export const O = 'users/default_photo/O_qajpkr.svg';
export const P = 'users/default_photo/P_o4abrb.svg';
export const Q = 'users/default_photo/Q_gpot4c.svg';
export const R = 'users/default_photo/R_ou8eif.svg';
export const S = 'users/default_photo/S_ldrdro.svg';
export const T = 'users/default_photo/T_pdj8ac.svg';
export const U = 'users/default_photo/U_dxb2wf.svg';
export const V = 'users/default_photo/V_f1wguh.svg';
export const W = 'users/default_photo/W_pktcua.svg';
export const X = 'users/default_photo/X_hzcnc2.svg';
export const Y = 'users/default_photo/Y_nbkrrk.svg';
export const Z = 'users/default_photo/Z_et3qmm.svg';

@Component({
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.sass']
})
export class SignUpPage implements OnInit {
  error = false;
  errorEmail = false;
  errorUsername = false;
  errorMsg: string;
  form: FormGroup;
  color = '#0276ac';
  emailPattern = "^[a-zA-Z0-9.-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}$";
  namePattern = "^[a-zA-ZA-Яa-я]{1,}"

  countries: CountryModel[];
  cities: CityModel[];

  categoryIs = false;
  numberOfChanges = 0;
  defaultLengthControlCity: number;
  options: string[] = [];

  filteredOptions: Observable<CountryModel[]>;
  filteredOptionsCity: Observable<CityModel[]>;

  constructor(
    private readonly currentUserService: CurrentUserService,
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly title: Title,
    private readonly dialog: MatDialog,
    private readonly commonService: CommonService,
    private readonly userService: UserService
  ) {
    this.title.setTitle('Регистрация');
  }

  private initForm(): FormGroup {
    return this.fb.group({
      username: this.fb.control('', [Validators.required, userNameRegExp, this.noWhitespaceValidator, Validators.min(4)]),
      password: this.fb.control('', [Validators.required, this.noWhitespaceValidator, Validators.min(5)]),
      firstName: this.fb.control('', [Validators.required, this.noWhitespaceValidator, Validators.pattern(this.namePattern)]),
      lastName: this.fb.control('', [Validators.required, this.noWhitespaceValidator, Validators.pattern(this.namePattern)]),
      email: this.fb.control('', [Validators.required, this.noWhitespaceValidator, Validators.pattern(this.emailPattern)]),
      country: this.fb.control(''),
      city: this.fb.control('')
    });
  }

  ngOnInit(): void {
    this.commonService.getCountries().subscribe((response) => {
      this.countries = response;
      this.filteredOptions = this.form.get('country').valueChanges.pipe(
        startWith(''),
        map((value) => (typeof value === 'string' ? value : value.countryName)),
        map((countryName) => (countryName ? this._filter(countryName) : this.countries.slice()))
      );
    });

    this.form = this.initForm();
    this._updateOrGetCity(null);

    this.form.get('country').valueChanges.subscribe(() => this._updateOrGetCity());
  }

  private _filter(name: string): CountryModel[] {
    const filterValue = name.toLowerCase();
    return this.countries.filter((option) => option.countryName.toLowerCase().indexOf(filterValue) === 0);
  }

  displayFn(country: CountryModel): string {
    return country && country.countryName ? country.countryName : '';
  }

  displayFnCity(city: CityModel): string {
    return city && city.titleRu ? city.titleRu : '';
  }

  private _updateOrGetCity(value?: string): void {
    if (value === '') {
      value = null;
    }
    let country;
    try {
      console.log('country' + this.form.get('country').value.countryUuidId);
      if (this.form.get('country').value.countryUuidId !== undefined) {
        country = this.form.get('country').value.countryUuidId;
      }
    } catch (e) {
      console.log(e);
    }
    this.commonService.getCities(country, value).subscribe((response) => {
      this.cities = response;
      this.filteredOptionsCity = this.form.get('city').valueChanges.pipe(
        startWith(''),
        map((value) => (typeof value === 'string' ? value : value.titleRu)),
        map((titleRu) => (titleRu ? this._filterCity(titleRu) : this.cities.slice()))
      );
    });
  }

  private _filterCity(name: string): CityModel[] {
    const filterValue = name.toLowerCase();
    return this.cities.filter((option) => option.titleRu.toLowerCase().indexOf(filterValue) === 0);
  }

  ngAfterViewInit() {
    this.form.get('city').valueChanges.subscribe(() => {
      if (
        this.numberOfChanges > 2 &&
        this.defaultLengthControlCity < this.form.get('city').value.length &&
        this.numberOfChanges % 2 === 0
      ) {
        this._updateOrGetCity(this.form.get('city').value);
      }
      this.defaultLengthControlCity = this.form.get('city').value.length;
      this.numberOfChanges++;
    });
  }

  handleFormSubmit(value: SignUpFormData): void {
    console.log(value);
    this.error = false;
    const photo = this.getDefaultPhotoId(value.username[0]);
    if (value.city.cityUuidId === undefined) {
      value.city = null;
    }
    if (value.country.countryUuidId === undefined) {
      value.country = null;
    }
    this.currentUserService
      .createUser(value.username, value.password, value.firstName, value.lastName, value.email, photo, value.country, value.city)
      .subscribe(
        () => {
          this.currentUserService
            .login(value.email, value.password)
            // .pipe(switchMap(() => this.getUserService.refreshCurrentUser()))
            .subscribe(
              (response: any) => {
                localStorage.setItem('auth_token', response.token);
                localStorage.setItem('user_id', response.id);
                // this.token = response.token;
                this.router.navigate(['/feed']).then(() => window.location.reload());
              },
              (error) => {
                console.error('Error', error);
                this.error = true;
              }
            );
        },
        (error) => {
          console.log('error');
          console.log(error.debugMessage)
          if (error.error.message === 'username already in use'){
            this.errorUsername = true;
            console.log('this.errorUsername')
          };
          if (error.error.message === 'email already in use'){
            this.errorEmail = true;
            console.log('this.errorEmail')
          }
          this.error = true;
        }
      );
  }

  getDefaultPhotoId(char: string): string {
    switch (char.toUpperCase()) {
      case 'A':
        return A;
      case 'B':
        return B;
      case 'C':
        return C;
      case 'D':
        return D;
      case 'E':
        return E;
      case 'F':
        return F;
      case 'G':
        return G;
      case 'H':
        return H;
      case 'I':
        return I;
      case 'J':
        return J;
      case 'L':
        return L;
      case 'M':
        return M;
      case 'N':
        return N;
      case 'O':
        return O;
      case 'P':
        return P;
      case 'Q':
        return Q;
      case 'R':
        return R;
      case 'S':
        return S;
      case 'T':
        return T;
      case 'U':
        return U;
      case 'V':
        return V;
      case 'W':
        return W;
      case 'X':
        return X;
      case 'Y':
        return Y;
      default:
        return Z;
    }
  }

  public noWhitespaceValidator(control: FormControl) {
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { 'whitespace': true };
  }
}
