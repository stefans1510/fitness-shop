import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {
  private dialog = inject(MatDialog);

  confirm(title: string, message: string) {
    const dialogReference = this.dialog.open(ConfirmationDialogComponent, {
      maxWidth: '400px',
      data: { title, message }
    });

    return firstValueFrom(dialogReference.afterClosed());  // Returns a promise that resolves when the dialog is closed
  }
}
