import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
  IonContent, IonList, IonItem, IonInput, IonNote, IonAlert, IonIcon,
  ModalController, ToastController 
} from '@ionic/angular/standalone';
import { ServerSettingsService } from '../../core/services/server-settings.service';
import { addIcons } from 'ionicons';
import { warningOutline } from 'ionicons/icons';

@Component({
  selector: 'app-server-settings',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonList, IonItem, IonInput, IonNote, IonAlert, IonIcon
  ],
  templateUrl: './server-settings.page.html',
})
export class ServerSettingsPage implements OnInit {
  @Input() errorMessage?: string;
  
  private fb = inject(FormBuilder);
  private svc = inject(ServerSettingsService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);

  form = this.fb.nonNullable.group({
    url: ['', [Validators.required, this.urlValidator]],
    apiKey: ['', [Validators.required]],
  });

  firstRun = false;

  constructor() {
    addIcons({ warningOutline });
  }

  async ngOnInit() {
    const present = this.svc.ensureDefaults();
    this.form.patchValue(present);
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const t = await this.toastCtrl.create({ message: 'Please fix validation errors', duration: 2000, color: 'warning' });
      t.present();
      return;
    }
    try {
      await this.svc.save(this.form.getRawValue());
      const t = await this.toastCtrl.create({ message: 'Server settings saved', duration: 1500, color: 'success' });
      t.present();
      this.dismiss(true);
    } catch (e: any) {
      const t = await this.toastCtrl.create({ message: e?.message ?? 'Failed to save', duration: 2500, color: 'danger' });
      t.present();
    }
  }

  dismiss(saved = false) {
    this.modalCtrl.dismiss({ saved });
  }

  private urlValidator(control: any) {
    const value = control.value;
    if (!value) return null;
    
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return { invalidProtocol: true };
      }
      return null;
    } catch {
      return { invalidUrl: true };
    }
  }
}
