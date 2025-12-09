import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Title} from '@angular/platform-browser';
import {MatTableDataSource} from '@angular/material/table';
import {Ran1} from "../../../feed/components/feed/feed.component";


export interface Subs {
  id: number;
  snmpIP: string;
  snmpPort: string;
  community: string;
  FTPip: string,
  FTPport: string,
  pathTofiles: string,
  username: string,
  password: string,
  protocol: string
}

const ELEMENT_DATA: Subs[] = [
  {
    id: 1,
    snmpIP: 'localhost',
    snmpPort: '21',
    community: 'public',
    FTPip: 'localhost',
    FTPport: '21',
    pathTofiles: '/data',
    username: 'admin',
    password: 'root',
    protocol: 'aes'
  },
  {
    id: 2,
    snmpIP: '11.14.200.112',
    snmpPort: '21',
    community: 'public',
    FTPip: '11.14.200.112',
    FTPport: '21',
    pathTofiles: '/home/ems1/data',
    username: 'admin',
    password: 'root',
    protocol: 'aes'
  },
];

@Component({
  templateUrl: './events.page.html',
  styleUrls: ['./events.page.css']
})
export class EventsPage implements OnInit {
  constructor(private readonly router: Router, public titleStr: Title) {
    this.titleStr.setTitle('Подписки');
  }

  amount: number;
  data: any = [];
  id: number = 2;
  title: string = 'test';

  dataSource = ELEMENT_DATA;

  columns = [
    {
      columnDef: 'snmpIP',
      header: 'Адрес SNMP',
      cell: (element: Subs) => `${element.snmpIP}`,
    },
    {
      columnDef: 'snmpPort',
      header: 'Порт SNMP',
      // cell: (element: Subs) => `${element.snmpIP}`,
    },
    {
      columnDef: 'community',
      header: 'Поддерживаемая технология',
      // cell: (element: Ran1) => `${element.technology}`,
    },
    {
      columnDef: 'FTPip',
      header: 'Платформа',
      // cell: (element: Ran1) => `${element.platform}`,
    },
    {
      columnDef: 'FTPport',
      header: 'Подсеть',
      // cell: (element: Ran1) => `${element.network}`,
    },
    {
      columnDef: 'pathTofiles',
      header: 'Производитель',
      // cell: (element: Ran1) => `${element.manufactorer}`,
    },
    {
      columnDef: 'username',
      header: 'Статус',
      // cell: (element: Ran1) => `${element.manufactorer}`,
    },
    {
      columnDef: 'password',
      header: 'Адрес подключения',
      // cell: (element: Ran1) => `${element.ip}`,
    },
    {
      columnDef: 'protocol',
      header: 'Адрес подключения',
      // cell: (element: Ran1) => `${element.ip}`,
    },
    {
      columnDef: 'delete',
      header: 'Удаление',
      // cell: (element: Ran1) => `${element.ip}`,
    },
  ];
  displayedColumns = this.columns.map(c => c.columnDef);
  // displayedColumns: string[] = ['snmpIP', 'snmpPort', 'community', 'FTPip','FTPport','pathTofiles','username','password','protocol'];

  // tslint:disable-next-line:typedef
  removeCart(index: number) {
    // this.data.slice(index, 1);
    console.log(index);
    this.updateDataSource();
  }

  // tslint:disable-next-line:typedef
  updateDataSource() {
    this.dataSource = [{
      id: 2,
      snmpIP: '11.14.200.112',
      snmpPort: '21',
      community: 'public',
      FTPip: '11.14.200.112',
      FTPport: '21',
      pathTofiles: '/home/ems1/data',
      username: 'admin',
      password: 'root',
      protocol: 'aes'
    }];
  }

  ngOnInit(): void {
  }

  handleEventCreate(): void {
    this.router.navigate([`/events/add-event`]).then(() => this.router.onSameUrlNavigation);
  }
}
