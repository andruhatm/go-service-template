import { MinimalInformationUser } from '../users/models/minimal-information-user.model';

export interface RatingEvent {
  ratingId?: string;
  user: MinimalInformationUser;
  valRating: number;
}
