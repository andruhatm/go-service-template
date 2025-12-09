import { Role } from './role.model';
import { CountryModel } from '../../features/other-model/country.model';
import { EventCategory } from '../../features/other-model/category.model';
import {CityModel} from "../../features/other-model/city.model";

export interface LoggedUser {
  readonly userId?: string;
  readonly authenticated: true;
  readonly username: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly informationAboutYourself: string;
  readonly prem?: boolean;
  readonly lastDatePrem?: string;
  readonly phone?: string;
  // readonly medias?: MediaArr;
  readonly country?: CountryModel;
  readonly cityDTO?: CityModel;
  readonly categories?: EventCategory[];

  hasRole(role: Role): boolean;
}

export interface Anonymous {
  readonly authenticated: false;

  hasRole(role: Role): boolean;
}

export type CurrentUser = LoggedUser | Anonymous;
