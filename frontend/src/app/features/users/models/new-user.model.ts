import {CountryModel} from "../../other-model/country.model";
import {CityModel} from "../../other-model/city.model";

export interface NewUser {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
  createdBy?: number;

  country?: CountryModel;
  cityDTO?: CityModel;
}


