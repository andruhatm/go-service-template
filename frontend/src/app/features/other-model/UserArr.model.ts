import { EventCategory } from './category.model';
import { ExistingUser } from '../users/models/existing-user.model';
import { CurrentUserImpl } from '../../core/auth/current-user.service';

export interface UserArrModel {
  organizersDTO: CurrentUserImpl[];
}
