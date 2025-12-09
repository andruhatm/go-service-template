import { CityModel } from '../../other-model/city.model';
import { EventCategory } from '../../other-model/category.model';
import { OrganizersParticipantsArrayModel } from '../../other-model/organizersParticipantsArrayModel';
import { ExistingUser } from '../../users/models/existing-user.model';
import {CommentEvent} from "../../other-model/comment.model";
import {RatingEvent} from "../../other-model/ratingEvent.model";

export interface ExistingEvent {
  eventId: string;
  dateTime: string;
  place: string;
  creation_date?: string;
  briefDescription: string;
  fullDescription: string;
  cityDTO: CityModel | undefined;
  usersDTO: ExistingUser[];
  securityUrl?: string;
  rating: number;
  membersCount: number;
  categoriesEventDTOS: EventCategory[];
  likesUser?: OrganizersParticipantsArrayModel[];
  favoritesUser?: OrganizersParticipantsArrayModel[];
  organizersDTO: OrganizersParticipantsArrayModel[];
  comments?: CommentEvent[];
  ratings?: RatingEvent[];
}
