import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogComponent } from './dialog/dialog.component';
import {MatDialogModule} from "@angular/material/dialog";
import {MatButtonModule} from "@angular/material/button";
import { DialogLimitationsPremComponent } from './dialog-limitations-prem/dialog-limitations-prem.component';
import {RouterModule} from "@angular/router";



@NgModule({
  declarations: [DialogComponent, DialogLimitationsPremComponent],
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        RouterModule
    ]
})
export class DialogModule { }
