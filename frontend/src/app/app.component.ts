import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CurrentUserImpl, CurrentUserService } from './core/auth/current-user.service';

interface SearchFormData {
  input: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  user: CurrentUserImpl;

  constructor(public router: Router, private readonly currentUserService: CurrentUserService) {
    this.currentUserService.user$.subscribe((value: CurrentUserImpl) => {
      this.user = value;
      this.user.authenticated = true;
    });
    console.log(this.user);
  }

  tabClick(param: string): void {
    this.router.navigate(['/feed'], { queryParams: { query: param } });
  }

  handleSearchSubmit(value: SearchFormData): void {
    console.log(value);
    if (value.input) {
      this.router.navigate(['/search'], { queryParams: { query: value.input } });
    } else {
      return;
    }
  }
}
