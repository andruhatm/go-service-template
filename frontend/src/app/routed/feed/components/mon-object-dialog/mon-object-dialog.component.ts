import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MonObject } from '../../../../features/mon-objects/models/mon-object.model';

export interface MonObjectDialogData {
  mode: 'create' | 'edit' | 'view';
  object?: MonObject;
}

@Component({
  selector: 'app-mon-object-dialog',
  templateUrl: './mon-object-dialog.component.html',
  styleUrls: ['./mon-object-dialog.component.sass']
})
export class MonObjectDialogComponent implements OnInit {
  form: FormGroup;
  mode: 'create' | 'edit' | 'view';
  jsonMode = false;
  jsonText = '';

  constructor(
    public dialogRef: MatDialogRef<MonObjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MonObjectDialogData,
    private fb: FormBuilder
  ) {
    this.mode = data.mode;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [this.data.object?.name || '', Validators.required],
      type: [this.data.object?.type || ''],
      parentId: [this.data.object?.parentId || ''],
      childId: [this.data.object?.childId || ''],
      technology: [this.data.object?.technology || ''],
      platform: [this.data.object?.platform || ''],
      network: [this.data.object?.network || ''],
      manufacturer: [this.data.object?.manufacturer || '']
    });

    if (this.mode === 'view') {
      this.form.disable();
    }

    // Initialize JSON text if in JSON mode
    if (this.data.object) {
      this.jsonText = JSON.stringify(this.getFormData(), null, 2);
    }
  }

  getFormData(): any {
    const formValue = this.form.value;
    const result: any = {
      name: formValue.name
    };

    // Only include non-empty values
    if (formValue.type) result.type = formValue.type;
    if (formValue.parentId) result.parentId = formValue.parentId;
    if (formValue.childId) result.childId = formValue.childId;
    if (formValue.technology) result.technology = formValue.technology;
    if (formValue.platform) result.platform = formValue.platform;
    if (formValue.network) result.network = formValue.network;
    if (formValue.manufacturer) result.manufacturer = formValue.manufacturer;

    return result;
  }

  toggleJsonMode(): void {
    this.jsonMode = !this.jsonMode;
    if (this.jsonMode) {
      // Convert form to JSON
      this.jsonText = JSON.stringify(this.getFormData(), null, 2);
    } else {
      // Try to parse JSON back to form
      try {
        const parsed = JSON.parse(this.jsonText);
        this.form.patchValue(parsed);
      } catch (e) {
        console.error('Invalid JSON', e);
      }
    }
  }

  onSave(): void {
    if (this.jsonMode) {
      try {
        const parsed = JSON.parse(this.jsonText);
        this.dialogRef.close(parsed);
      } catch (e) {
        alert('Invalid JSON format');
      }
    } else {
      if (this.form.valid) {
        this.dialogRef.close(this.getFormData());
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  get title(): string {
    switch (this.mode) {
      case 'create':
        return 'Создать объект мониторинга';
      case 'edit':
        return 'Редактировать объект';
      case 'view':
        return 'Просмотр объекта';
      default:
        return '';
    }
  }

  get saveButtonText(): string {
    return this.mode === 'create' ? 'Создать' : 'Сохранить';
  }
}


