import {Component, OnInit} from '@angular/core';
import {CommonService} from '../../../../features/form/services/common.service';
import {ExistingEvent} from '../../../../features/events/models/existing-event.model';
import {EventsService} from '../../../../features/events/services/events.service';

import {DatePipe} from '@angular/common';
import { Router} from '@angular/router';
import {EventCategory} from '../../../../features/other-model/category.model';
import {CurrentUserImpl, CurrentUserService} from '../../../../core/auth/current-user.service';
import {MatDialog} from '@angular/material/dialog';
import {DefaultOrganizer} from '../../../../features/users/models/default-organizer.model';

export interface Ran2 {
  type?: string;
  name: string;
  operationalstate?: string;
  servingrrumkey?: string;
  singallingmdt?: string;
  commissioningstatus?: string;
  energysavingstate?: string;
  location: string;
  locationreferencerefname?: string;
  relatedcu?: string;
  networkelement?: string;
  servingrru?: string;
  datacollectionperiod?: number;
  cellid?: number;
  cellsize?: string;
  basetype?: string;
}

export interface Ran1 {
  name: string;
  type?: string;
  mkey?: string;
  technology: string[];
  platform: string[];
  network: string[];
  syncprocessstate?: string;
  manufactorer?: string;
  commissioningstatus?: string;
  mgmtip?: string;
  status?: string;
  ip: string;
}

const ELEMENT_DATA: Ran1[] = [
  {name: 'enb27738', type: 'eNodeB', technology: ['LTE'], platform: ['virtual'], network: ['Lester'], manufactorer: 'Nokia', status: 'ok', ip: '10.13.200.111'},
  {name: 'enb27742', type: 'eNodeB', technology: ['LTE'], platform: ['virtual'], network: ['Lester'], manufactorer: 'Nokia', status: 'ok', ip: '10.13.200.112'},
  {name: 'enb27746', type: 'eNodeB', technology: ['LTE'], platform: ['virtual'], network: ['Lester'], manufactorer: 'Nokia', status: 'ok', ip: '10.13.200.113'},
];

const ELEMENT_DATA2: Ran2[] = [
  {name: 'Cell:7100928 S:1', networkelement: 'enb27738', location: 'Deyn Hills', operationalstate: 'ok',  energysavingstate: 'Выкл', relatedcu: 'cu:27738-1', servingrru:'RRH:27738-001' },
  {name: 'Cell:7100929 S:2', networkelement: 'enb27738', location: 'Deyn Hills', operationalstate: 'ok',  energysavingstate: 'Выкл', relatedcu: 'cu:27738-1',servingrru:'RRH:27738-002' },
  {name: 'Cell:7100930 S:3', networkelement: 'enb27738', location: 'Deyn Hills', operationalstate: 'ok',  energysavingstate: 'Выкл', relatedcu: 'cu:27738-1',servingrru:'RRH:27738-003' },
  {name: 'Cell:7100932 S:1', networkelement: 'enb27738', location: 'Deyn Hills', operationalstate: 'ok',  energysavingstate: 'Выкл', relatedcu: 'cu:27738-1',servingrru:'RRH:27738-001' },
  {name: 'Cell:7100933 S:2', networkelement: 'enb27738', location: 'Deyn Hills', operationalstate: 'ok',  energysavingstate: 'Выкл', relatedcu: 'cu:27738-1',servingrru:'RRH:27738-002' },
  {name: 'Cell:7100931 S:3', networkelement: 'enb27738', location: 'Deyn Hills', operationalstate: 'ok',  energysavingstate: 'Выкл', relatedcu: 'cu:27738-1',servingrru:'RRH:27738-003' },

  {name: 'Cell:7101952 S:1', networkelement: 'enb27742', location: 'Spinney Hills', operationalstate: 'ok',  energysavingstate: 'Выкл', relatedcu: 'cu:27742-1', servingrru:'RRH:27742-001' },
  {name: 'Cell:7101953 S:2', networkelement: 'enb27742', location: 'Spinney Hills', operationalstate: 'ok',  energysavingstate: 'Выкл', relatedcu: 'cu:27742-1',servingrru:'RRH:27742-002' },
  {name: 'Cell:7101954 S:3', networkelement: 'enb27742', location: 'Spinney Hills', operationalstate: 'ok',  energysavingstate: 'Выкл', relatedcu: 'cu:27742-1',servingrru:'RRH:27742-003' },
  {name: 'Cell:7101955 S:3', networkelement: 'enb27742', location: 'Spinney Hills', operationalstate: 'ok',  energysavingstate: 'Выкл', relatedcu: 'cu:27742-1',servingrru:'RRH:27738-003' },
  {name: 'Cell:7101956 S:1', networkelement: 'enb27742', location: 'Spinney Hills', operationalstate: 'ok',  energysavingstate: 'Выкл', relatedcu: 'cu:27742-1',servingrru:'RRH:27738-001' },
  {name: 'Cell:7101957 S:2', networkelement: 'enb27742', location: 'Spinney Hills', operationalstate: 'ok',  energysavingstate: 'Выкл', relatedcu: 'cu:27742-1',servingrru:'RRH:27738-002' },

];

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.sass']
})
export class FeedComponent implements OnInit {

  constructor(
    private readonly commonService: CommonService,
    private readonly eventsService: EventsService,
    public readonly datepipe: DatePipe,
    private readonly currentUserService: CurrentUserService,
    private readonly router: Router,
    public dialog: MatDialog
  ) {

  }

  columns = [
    {
      columnDef: 'name',
      header: 'Имя',
      cell: (element: Ran1) => `${element.name}`,
    },
    {
      columnDef: 'type',
      header: 'Тип',
      cell: (element: Ran1) => `${element.type}`,
    },
    {
      columnDef: 'technology',
      header: 'Поддерживаемая технология',
      cell: (element: Ran1) => `${element.technology}`,
    },
    {
      columnDef: 'platform',
      header: 'Платформа',
      cell: (element: Ran1) => `${element.platform}`,
    },
    {
      columnDef: 'network',
      header: 'Подсеть',
      cell: (element: Ran1) => `${element.network}`,
    },
    {
      columnDef: 'manufactorer',
      header: 'Производитель',
      cell: (element: Ran1) => `${element.manufactorer}`,
    },
    {
      columnDef: 'status',
      header: 'Статус',
      cell: (element: Ran1) => `${element.status}`,
    },
    {
      columnDef: 'ip',
      header: 'Адрес подключения',
      cell: (element: Ran1) => `${element.ip}`,
    },
  ];
  columns2 = [
    {
      columnDef: 'name',
      header: 'Имя',
      cell: (element: Ran2) => `${element.name}`,
    },
    {
      columnDef: 'networkelement',
      header: 'Узел связи',
      cell: (element: Ran2) => `${element.networkelement}`,
    },
    {
      columnDef: 'location',
      header: 'Местоположение',
      cell: (element: Ran2) => `${element.location}`,
    },
    {
      columnDef: 'operationalstate',
      header: 'Статус',
      cell: (element: Ran2) => `${element.operationalstate}`,
    },
    {
      columnDef: 'energysavingstate',
      header: 'Энергоэффективный режим',
      cell: (element: Ran2) => `${element.energysavingstate}`,
    },
    {
      columnDef: 'relatedcu',
      header: 'Централизованный блок',
      cell: (element: Ran2) => `${element.relatedcu}`,
    },
    {
      columnDef: 'servingrru',
      header: 'Удаленный радио модуль',
      cell: (element: Ran2) => `${element.servingrru}`,
    },
  ];
  dataSource = ELEMENT_DATA;
  dataSource2 = ELEMENT_DATA2;
  displayedColumns = this.columns.map(c => c.columnDef);
  displayedColumns2 = this.columns2.map(c => c.columnDef);


  events: ExistingEvent[];
  user: CurrentUserImpl;
  date: Date;
  defaultOganizer: DefaultOrganizer;
  dateString: string;
  currentTutorial = null;
  currentIndex = -1;
  pagesCount: number;
  title = '';
  modal = false;

  dateSort = true;
  rateSort;
  membersSort;

  dateIcon = 'expand_more';
  membersIcon;
  rateIcon;

  userCity;

  loading = false;

  page = 1;
  count = 0;
  pageSize = 15;
  query = 'empty';
  categories: EventCategory[];

  isEmptyResponse = false;
  cells: boolean;

  ngOnInit(): void {
    this.categories = [
      {nameCategory: 'Узлы связи' },
      {nameCategory: 'Соты' },
      {nameCategory: 'Централизованный блок' },
      {nameCategory: 'Децентрализованный блок' },
      {nameCategory: 'Антенный сектор' },
      {nameCategory: 'Удаленный радио модуль' },
    ];

    this.router.onSameUrlNavigation = 'reload';

  }

  handleCategoryClick(item: EventCategory): void {
    console.log(item);
    this.cells = true;
  }
}
