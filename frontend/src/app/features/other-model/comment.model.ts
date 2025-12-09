import { ExistingUser } from '../users/models/existing-user.model';
import { MinimalInformationUser } from '../users/models/minimal-information-user.model';

export interface CommentEvent {
  commentId?: string;
  message: string;
  commentDate?: string;
  user: MinimalInformationUser;
}
