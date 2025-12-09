import {AfterViewInit, Component, OnInit} from '@angular/core';
import {CurrentUserImpl, CurrentUserService} from '../../../../core/auth/current-user.service';
import { FormBuilder, FormGroup} from '@angular/forms';
import {Observable} from 'rxjs';
import {CommonService} from '../../../../features/form/services/common.service';
import {EventCategory} from '../../../../features/other-model/category.model';
import {EventsService} from '../../../../features/events/services/events.service';
import {Title} from '@angular/platform-browser';
import {CityModel} from '../../../../features/other-model/city.model';
import {Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {DialogComponent} from "../../../dialog/dialog/dialog.component";

export interface Meta {
  resource_type?: string;
  format?: string;
  url?: string;
  secure_url?: string;
  public_id?: string;
  width?: number;
  height?: number;
}

export interface Info {
  event: string;
  info: Meta;
  type?: string;
}

interface FormData {
  chipsControl: string[];
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  informationAboutYourself: string;
  // dateTime: number;
}

@Component({
  selector: 'app-add-event',
  templateUrl: './add-event.page.html',
  styleUrls: ['./add-event.page.css']
})
export class AddEventPage implements OnInit, AfterViewInit {
  user: CurrentUserImpl;
  form: FormGroup;
  imageUpload: boolean = false;
  minDate = new Date(Date.now());
  error = false;
  categoryIs = false;
  numberOfChanges = 0;
  defaultLengthControlCity = 0;
  info: Info;
  meta: Meta;

  cities: CityModel[];
  categories: EventCategory[];

  categoryList: string[] = [];

  chipsControlValue$: Observable<any>;

  filteredOptionsCity: Observable<CityModel[]>;
  private widget: any = null;
  public_id: string = null;
  avatar_person;
  height;
  width;
  secure_url;

  constructor(
    private readonly getCurrentUser: CurrentUserService,
    private readonly currentUserService: CurrentUserService,
    private readonly commonService: CommonService,
    private readonly eventService: EventsService,
    private readonly title: Title,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    public dialog: MatDialog
  ) {
    this.title.setTitle('Добавить подписку');
  }

  ngOnInit(): void {

    this.form = this.initForm();

    this.chipsControlValue$ = this.form.get('chipsControl').valueChanges;

    console.log('form initialized');

  }

  initForm(): FormGroup {
    return this.fb.group({
      snmpIP: this.fb.control(''),
      snmpPort: this.fb.control(''),
      community: this.fb.control(''),
      FTPip: this.fb.control(''),
      FTPport: this.fb.control(''),
      pathTofiles: this.fb.control(''),
      username: this.fb.control(''),
      password: this.fb.control(''),
      protocol: this.fb.control(''),

    });
  }

  handleFormSubmit(): void {
    const value = this.form.value;

    console.log(value);
    // console.log(this.form.value.chipsControl);


    // TODO add files
    // this.eventService
    //   .createEvent(value.date, value.place, value.name, value.description, value.city.cityUuidId, value.chipsControl,
    //     this.public_id, this.avatar_person, this.height, this.width, this.secure_url)
    //   .subscribe(
    //     (data ) => {
    //       console.log('event creation success');
    //       this.router.navigate(['/event', data.eventId]);
    //     },
    //     (error: HttpErrorResponse) => {
    //       // console.log('event creation error');
    //       console.log(error);
    //       console.log('event creation success');
    //     }
    //   );
    console.log(this.form.value);
  }

  convertToDate(time: string, date: any): Date {
    const timeArr = time.split(':');
    date.setSeconds(0);
    date.setMinutes(timeArr[1]);
    date.setHours(timeArr[0]);
    return date;
  }

  ngAfterViewInit(): void {
  }

  openDialog() {
    const dialogRef = this.dialog.open(DialogComponent);

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }
}
