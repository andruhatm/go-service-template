import {Component, OnInit} from "@angular/core";
import {MatDialogRef} from "@angular/material/dialog";
import {FormBuilder, FormGroup} from "@angular/forms";
import {Router} from "@angular/router";
import {CreateAnomaly} from "../../../../features/other-model/anomalies.model";
import {AnomalyService} from "../../../../features/form/services/anomaly.service";

@Component({
  selector: 'forecast-add-dialog',
  styleUrls: ['./forecast-dialog.component.css'],
  templateUrl: './forecast.dialog.component.html',
})
export class ForecastDialogComponent implements OnInit{
  constructor(
    public dialogRef: MatDialogRef<ForecastDialogComponent>,
    private readonly fb: FormBuilder,
    private readonly anomalyService: AnomalyService,
    private readonly  router: Router
  ) {}

  form: FormGroup;

  ngOnInit() {
    this.form = this.initForm();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  handleFormSubmit(): void {
    const value = this.form.value;

    const data: CreateAnomaly = {
      name: value.name,
      model: value.model,
      objectName: value.objName
    };

    console.log(value);
    console.log('handle Form');

    this.anomalyService
      .putAnomalyForecast(data).add(() => {
      this.router.navigate(['/anomaly'])
    })
    console.log(this.form.value);
  }

  // tslint:disable-next-line:typedef
  private initForm() {
    return this.fb.group({
      name: this.fb.control(''),
      model: this.fb.control(''),
      objName: this.fb.control(''),
    });
  }
}
