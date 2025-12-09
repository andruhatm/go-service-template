import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {ExistingEvent} from "../events/models/existing-event.model";
import {Observable} from "rxjs";
import {Injectable} from "@angular/core";
import {EventsService} from "../events/services/events.service";
import {UserService} from "../users/services/users.service";
import {AnotherUser} from "../users/models/another-user.model";

@Injectable({ providedIn: "root"})
export class UserResolver implements Resolve<AnotherUser>{
  constructor(private readonly userService: UserService) {}
  resolve(route: ActivatedRouteSnapshot): Observable<AnotherUser> | Promise<AnotherUser> | AnotherUser {
    return this.userService.getAnotherUserById(route.params['id']);
  }

}
