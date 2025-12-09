import {UserRole} from './user-role.model';
import {UserStatus} from './user-status.model';
import {PersonalInfo} from './personal-info.model';

export interface UpdatableUser {
  password: string;
  role: UserRole;
  status: UserStatus;
  personalInfo: PersonalInfo;
}
