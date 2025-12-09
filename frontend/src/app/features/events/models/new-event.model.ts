
import { EventCategory } from '../../other-model/category.model';
import { OrganizersParticipantsArrayModel } from '../../other-model/organizersParticipantsArrayModel';
import { CityModel } from '../../other-model/city.model';


export interface NewEvent {
  dateTime: string;
  place: string;
  briefDescription: string;
  fullDescription: string;
  cityDTO: CityModel;
  categoriesEventDTOS: EventCategory[];
  organizersDTO: OrganizersParticipantsArrayModel[];
  usersDTO: OrganizersParticipantsArrayModel[];
  securityUrl?: string;
}
