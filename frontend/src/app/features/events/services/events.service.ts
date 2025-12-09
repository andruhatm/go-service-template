import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { NewEvent } from '../models/new-event.model';
import { EventCategory } from '../../other-model/category.model';
import { ExistingEvent } from '../models/existing-event.model';
import { PaginationRespModel } from '../../other-model/pagination.resp.model';
import { Title } from '@angular/platform-browser';
import { OrganizersParticipantsArrayModel } from '../../other-model/organizersParticipantsArrayModel';
import { CommentEvent } from '../../other-model/comment.model';
import { RatingEvent } from '../../other-model/ratingEvent.model';

interface PathEvent {
  usersDTO: OrganizersParticipantsArrayModel[];
}

interface Like {
  likesUser: OrganizersParticipantsArrayModel[];
}

interface Favorite {
  favoritesUser: OrganizersParticipantsArrayModel[];
}

class Comments {
  comments: CommentEvent[];
}

class Ratings {
  ratings: RatingEvent[];
}

interface deleteUser {
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  constructor(private readonly http: HttpClient, private readonly title: Title) {
    title.setTitle('Лента');
  }

  getAll(params): Observable<PaginationRespModel> {
    return this.http.get<PaginationRespModel>(`${environment.api}/event/old`, { params });
  }

  getFiltered(params): Observable<PaginationRespModel> {
    return this.http.get<PaginationRespModel>(`${environment.api}/event/`, { params });
  }

  getSubscriptions(params): Observable<PaginationRespModel> {
    return this.http.get<PaginationRespModel>(`${environment.api}/user/${localStorage.getItem('user_id')}/events`, {
      params
    });
  }

  getFavourites(params): Observable<PaginationRespModel> {
    return this.http.get<PaginationRespModel>(`${environment.api}/user/${localStorage.getItem('user_id')}/favourites`, {
      params
    });
  }

  getRecommendations(): Observable<ExistingEvent[]> {
    return this.http.get<ExistingEvent[]>(`${environment.api}/event/recommendation/${localStorage.getItem('user_id')}`);
  }

  createEvent(
    dateTime: string,
    place: string,
    briefDescription: string,
    fullDescription: string,
    cityId: string,
    categories: string[],
    public_id?: string,
    // avatar_person?: number,
    // height?: number,
    // width?: number,
    secure_url?: string
  ): Observable<ExistingEvent> {
    const categoriesList: EventCategory[] = [];
    for (const c of categories) {
      categoriesList.push({
        nameCategory: c
      });
    }
    if (public_id !== null) {
      const data: NewEvent = {
        dateTime,
        place,
        briefDescription,
        fullDescription,
        cityDTO: {
          cityUuidId: cityId
        },
        categoriesEventDTOS: categoriesList,
        organizersDTO: Array.of(new OrganizersParticipantsArrayModel(`${localStorage.getItem('user_id')}`)),
        usersDTO: Array.of(new OrganizersParticipantsArrayModel(`${localStorage.getItem('user_id')}`)),
        securityUrl: secure_url
      };
      return this.http.post<ExistingEvent>(`${environment.api}/event/`, data);
    } else {
      const data: NewEvent = {
        dateTime,
        place,
        briefDescription,
        fullDescription,
        cityDTO: {
          cityUuidId: cityId
        },
        categoriesEventDTOS: categoriesList,
        organizersDTO: Array.of(new OrganizersParticipantsArrayModel(`${localStorage.getItem('user_id')}`)),
        usersDTO: Array.of(new OrganizersParticipantsArrayModel(`${localStorage.getItem('user_id')}`)),
        securityUrl: secure_url
      };
      return this.http.post<ExistingEvent>(`${environment.api}/event/`, data);
    }
  }

  getEvent(id: string): Observable<ExistingEvent> {
    return this.http.get<ExistingEvent>(`${environment.api}/event/${id}`);
  }

  patchUser(id: string): Observable<ExistingEvent> {
    const data: PathEvent = {
      usersDTO: Array.of(new OrganizersParticipantsArrayModel(`${localStorage.getItem('user_id')}`))
    };
    return this.http.patch<ExistingEvent>(`${environment.api}/event/${id}/`, data);
  }

  patchLike(id: string): Observable<ExistingEvent> {
    const data: Like = {
      likesUser: Array.of(new OrganizersParticipantsArrayModel(`${localStorage.getItem('user_id')}`))
    };
    return this.http.patch<ExistingEvent>(`${environment.api}/event/${id}/like`, data);
  }

  patchFavorite(id: string): Observable<ExistingEvent> {
    const data: Favorite = {
      favoritesUser: Array.of(new OrganizersParticipantsArrayModel(`${localStorage.getItem('user_id')}`))
    };
    return this.http.patch<ExistingEvent>(`${environment.api}/event/${id}/favorites`, data);
  }

  patchComment(id: string, comment: CommentEvent): Observable<ExistingEvent> {
    const data: Comments = {
      comments: Array.of(comment)
    };
    return this.http.patch<ExistingEvent>(`${environment.api}/event/${id}/comment`, data);
  }

  patchRating(id: string, rating: RatingEvent): Observable<ExistingEvent> {
    const data: Ratings = {
      ratings: Array.of(rating)
    };
    return this.http.patch<ExistingEvent>(`${environment.api}/event/${id}/rating`, data);
  }

  deleteUser(id: string) {
    const data: deleteUser = {
      userId: localStorage.getItem('user_id')
    };
    return this.http.put<void>(`${environment.api}/event/${id}/delete/user`, data);
  }

  deleteLike(id: string) {
    const data: deleteUser = {
      userId: localStorage.getItem('user_id')
    };
    return this.http.put<void>(`${environment.api}/event/${id}/delete/like`, data);
  }

  deleteFavorite(id: string) {
    const data: deleteUser = {
      userId: localStorage.getItem('user_id')
    };
    return this.http.put<void>(`${environment.api}/event/${id}/delete/favorites`, data);
  }

  deleteEvent(id: string) {
    return this.http.delete(`${environment.api}/event/${id}`);
  }

  deleteComment(id: string) {
    return this.http.delete<void>(`${environment.api}/event/delete/comment/${id}`);
  }
}
