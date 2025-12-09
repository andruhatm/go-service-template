import { EventCategory } from './category.model';


export class OrganizersParticipantsArrayModel {
  userId: string;
  email?: string;

  firstName?: string;
  lastName?: string;

  constructor(userId: string) {
    this.userId = userId;
  }
}
