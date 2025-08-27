import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
  IonContent, IonList, IonItem, IonInput, IonLabel, IonIcon,
  IonSpinner, IonCard, IonCardContent,
  ModalController, ToastController 
} from '@ionic/angular/standalone';
import { ServerSettingsService } from '../../core/services/server-settings.service';
import { SystemService } from '../../core/services/system.service';
import { addIcons } from 'ionicons';
import { warningOutline, checkmarkCircle } from 'ionicons/icons';

@Component({
  selector: 'app-server-settings',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonList, IonItem, IonInput, IonLabel, IonIcon,
    IonSpinner, IonCard, IonCardContent
  ],
  templateUrl: './server-settings.page.html',
})
export class ServerSettingsPage implements OnInit {
  @Input() errorMessage?: string;
  @Input() onAllowClose?: () => void;
  
  private fb = inject(FormBuilder);
  private svc = inject(ServerSettingsService);
  private systemSvc = inject(SystemService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);

  form = this.fb.nonNullable.group({
    url: ['', [Validators.required]],
    apiKey: ['', [Validators.required]],
  });

  firstRun = false;
  isVerifying = false;
  isSuccess = false;
  verificationError = '';

  constructor() {
    addIcons({ warningOutline, checkmarkCircle });
  }

  async ngOnInit() {
    const present = this.svc.ensureDefaults();
    this.form.patchValue(present);

    // If we were opened with an initial error message (e.g., from tabs), show it
    if (this.errorMessage) {
      console.log('ServerSettingsPage: Initial error message:', this.errorMessage);
      this.verificationError = this.errorMessage;
    }
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const t = await this.toastCtrl.create({ message: 'Please fill in all required fields', duration: 2000, color: 'warning' });
      t.present();
      return;
    }

    const values = this.form.getRawValue();
    
    // Validate URL format
    if (!this.isValidUrl(values.url)) {
      this.verificationError = 'Invalid URL format. Please use http:// or https://';
      return;
    }

    // Reset states
    this.isVerifying = true;
    this.isSuccess = false;
    this.verificationError = '';

    try {
      // Save settings temporarily to test connection
      await this.svc.save(values);
      
      // Test connection with system status endpoint
      // Use statusText for more specific error messages
      this.systemSvc.checkStatus({ preferStatusText: true }).subscribe({
        next: (status) => {
          if (status.isConnected) {
            // Success!
            this.isVerifying = false;
            this.isSuccess = true;
            
            // Show success state briefly then close
            setTimeout(() => {
              // Allow the modal to be dismissed if it was locked
              this.onAllowClose?.();
              this.dismiss(true);
            }, 1000);
          } else {
            // Connection failed
            this.isVerifying = false;
            this.verificationError = status.error || 'Failed to connect to server';
            console.log('ServerSettingsPage: Connection failed with error:', this.verificationError);
            
            // Reset saved settings on failure
            this.svc.reset();
          }
        },
        error: (e) => {
          this.isVerifying = false;
          this.verificationError = e?.message || 'Failed to connect to server. Please check your settings.';
          
          // Reset saved settings on failure
          this.svc.reset();
        }
      });
    } catch (e: any) {
      // Handle save validation errors
      this.isVerifying = false;
      this.verificationError = e?.message || 'Invalid settings';
    }
  }

  private isValidUrl(value: string): boolean {
    if (!value) return false;
    
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  }

  dismiss(saved = false) {
    this.modalCtrl.dismiss({ saved });
  }

}
