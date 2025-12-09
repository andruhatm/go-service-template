// ng-starrating
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-book-rating',
  template: `
    <div class="book-rating" data-jest="stars">
      <span *ngFor="let fullStar of fullStars" class="fa fa-star checked" data-jest="full star"></span>
      <span *ngIf="hasAnHalfStar" class="fa fa-star-half-empty" data-jest="half star"></span>
      <span *ngFor="let emptyStar of emptyStars" class="fa fa-star-o" data-jest="empty star"></span>
    </div>
  `,
  styles: [
    `
                .fa-star,
                .fa-star-half-empty,
                .fa-star-o {
                  color: orange;
                }
                .book-rating {
                  min-width: 100px;
                }
              `
  ]
})
export class BookRatingComponent {
  private readonly MAX_NUMBER_OF_STARS = 5;

  @Input()
  rating = 0;

  private get numberOfFullStars(): number {
    return Math.floor(this.rating);
  }

  private get numberOfEmptyStars(): number {
    return this.MAX_NUMBER_OF_STARS - Math.ceil(this.rating);
  }

  get fullStars(): any[] {
    return Array(this.numberOfFullStars);
  }

  get emptyStars(): any[] {
    return Array(this.numberOfEmptyStars);
  }

  get hasAnHalfStar(): boolean {
    return this.rating % 1 !== 0;
  }
}
