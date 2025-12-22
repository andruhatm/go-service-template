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
  chipsControlValue$: any; // Если у вас есть чипсы, оставьте это
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

    // Получаем переданные данные из navigation state
    const nav = this.router.getCurrentNavigation();
    const state = nav && nav.extras && nav.extras.state ? (nav.extras.state as any) : null;

    if (state && state.editMode && state.item) {
      this.enterEditMode(state.item as Subs);
    }
    // Если у вас есть chipsControl, инициализируйте его
    this.chipsControlValue$ = this.form.get('chipsControl') ? this.form.get('chipsControl')!.valueChanges : null;
  }

  // Обновленная инициализация формы для включения всех полей Subs
  initForm(): FormGroup {
    return this.fb.group({
      sourceName: this.fb.control('', Validators.required), // Добавил Validators.required
      description: this.fb.control(''),
      connectionType: this.fb.control('', Validators.required), // Соответствует connection_type
      host: this.fb.control('', Validators.required),
      FTPport: this.fb.control('', Validators.required),
      filePath: this.fb.control(''), // Соответствует file_path
      username: this.fb.control(''),
      password: this.fb.control(''),
      schedule: this.fb.control(''),
      // Если у вас были эти поля для SNMP или другие, оставьте их
      snmpIP: this.fb.control(''),
      snmpPort: this.fb.control(''),
      community: this.fb.control(''),
      chipsControl: this.fb.control([]) // Если используется
    });
  }

  private enterEditMode(item: Subs): void {
    this.isEditMode = true;
    this.editingItemId = item.id;
    // Мэппинг полей из item в форму
    this.form.patchValue({
      sourceName: item.source_name ?? '',
      description: item.description ?? '',
      connectionType: item.connection_type ?? '',
      host: item.host ?? '',
      FTPport: item.FTPport ?? '',
      filePath: item.file_path ?? '',
      username: item.username ?? '',
      password: item.password ?? '',
      schedule: item.schedule ?? '',
      // Возможно, вам нужно будет сопоставить snmpIP, snmpPort, community из item,
      // если они есть в Subs и заполняются из бэкенда
    });
  }

  handleFormSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // Помечаем все поля как затронутые для отображения ошибок
      console.error('Form is invalid. Cannot submit.');
      return;
    }

    const value = this.form.value;

    // Формируем payload на основе модели Subs
    const payload: Partial<Subs> = {
      source_name: value.sourceName,
      description: value.description,
      connection_type: value.connectionType,
      host: value.host,
      FTPport: value.FTPport,
      file_path: value.filePath,
      username: value.username,
      password: value.password,
      schedule: value.schedule,
    };

    if (this.isEditMode && this.editingItemId) {
      this.emsService.update(this.editingItemId, payload).subscribe({
        next: () => this.router.navigate(['/ems']),
        error: (err) => console.error('Update error', err)
      });
    } else {
      this.emsService.create(payload).subscribe({
        next: () => this.router.navigate(['/ems']),
        error: (err) => console.error('Create error', err)
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
