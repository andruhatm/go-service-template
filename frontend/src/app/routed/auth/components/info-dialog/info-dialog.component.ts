import { Component, OnInit } from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {Router} from '@angular/router';

@Component({
  templateUrl: './info-dialog.component.html',
  styleUrls: ['./info-dialog.component.sass']
})
export class InfoDialogComponent implements OnInit {

  constructor(
    private readonly dialogRef: MatDialogRef<InfoDialogComponent, boolean>,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
  }

  handleOkClick(): void {
    this.dialogRef.close();
    this.router.navigate(['/auth/login']);
  }
}
