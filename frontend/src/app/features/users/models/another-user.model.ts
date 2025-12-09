
// import {MediaArr} from "../../media-file/models/media-arr.model";
import {CountryModel} from "../../other-model/country.model";
import {CityModel} from "../../other-model/city.model";
import {EventCategory} from "../../other-model/category.model";

export interface AnotherUser{
  userId?: string;
  username?: string;
  prem?: boolean;
  firstName: string;
  lastName: string;
  email?:string;
  // medias?: MediaArr;
  informationAboutYourself?: string;
  country?: CountryModel;
  cityDTO?: CityModel;
  categories?: EventCategory[];
}
