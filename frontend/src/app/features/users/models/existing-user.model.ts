
import { Role } from '../../../core/auth/role.model';
import { CountryModel } from '../../other-model/country.model';
import { CategoryArr } from '../../other-model/CategoryArr.model';
import { CityModel } from '../../other-model/city.model';
import { EventCategory } from '../../other-model/category.model';

export interface ExistingUser {
  userId?: string;
  username?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  // token?: string;
  roles?: [Role];
  createdAt?: string;
  createdBy?: number;

  informationAboutYourself?: string;
  categories?: EventCategory[];
}
