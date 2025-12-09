import { ExistingEvent } from '../events/models/existing-event.model';

export interface PaginationRespModel {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  events: ExistingEvent[];
}
