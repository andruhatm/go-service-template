import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; // Добавил Validators
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../../../dialog/dialog/dialog.component';
import { EmsService, Subs } from '../ems.service'; // Убедитесь, что путь верен

@Component({
  selector: 'app-add-event',
  templateUrl: './add-event.page.html',
  styleUrls: ['./add-event.page.css']
})
export class AddEventPage implements OnInit, AfterViewInit {
  form: FormGroup;
  isEditMode = false;
  editingItemId: number | null = null;
  error = false;

  constructor(
    private readonly title: Title,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly emsService: EmsService,
    public dialog: MatDialog

  ) {
    this.title.setTitle('Добавить подписку');
  }

  ngOnInit(): void {
    this.form = this.initForm();

    // Получаем переданные данные из navigation state (для режима редактирования)
    const state = history.state;
    if (state && state.editMode && state.item) {
      this.enterEditMode(state.item as Subs);
    }
  }

  // Инициализация формы согласно интерфейсу Subs
  initForm(): FormGroup {
    return this.fb.group({
      source_name: this.fb.control('', Validators.required),
      description: this.fb.control(''),
      connection_type: this.fb.control('', Validators.required),
      host: this.fb.control('', Validators.required),
      FTPport: this.fb.control('', Validators.required),
      file_path: this.fb.control('', Validators.required),
      username: this.fb.control(''),
      password: this.fb.control(''),
      schedule: this.fb.control('', Validators.required)
    });
  }

  private enterEditMode(item: Subs): void {
    this.isEditMode = true;
    this.editingItemId = item.id;
    this.title.setTitle('Редактировать подписку');
    
    // Заполняем форму данными из item
    this.form.patchValue({
      source_name: item.source_name ?? '',
      description: item.description ?? '',
      connection_type: item.connection_type ?? '',
      host: item.host ?? '',
      FTPport: item.FTPport ?? '',
      file_path: item.file_path ?? '',
      username: item.username ?? '',
      password: item.password ?? '',
      schedule: item.schedule ?? ''
    });
  }

  handleFormSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      console.error('Form is invalid. Cannot submit.');
      this.error = true;
      return;
    }

    const payload: Partial<Subs> = this.form.value;

    if (this.isEditMode && this.editingItemId !== null) {
      // Обновление существующей подписки
      this.emsService.update(this.editingItemId, payload).subscribe({
        next: () => {
          console.log('Subscription updated successfully');
          this.router.navigate(['/ems']);
        },
        error: (err) => {
          console.error('Update error', err);
          this.error = true;
        }
      });
    } else {
      // Создание новой подписки
      this.emsService.create(payload).subscribe({
        next: () => {
          console.log('Subscription created successfully');
          this.router.navigate(['/ems']);
        },
        error: (err) => {
          console.error('Create error', err);
          this.error = true;
        }
      });
    }
  }

  ngAfterViewInit(): void {}

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogComponent);
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }
}
