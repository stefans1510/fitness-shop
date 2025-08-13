import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ViewStateService {
  private contactInViewSubject = new BehaviorSubject<boolean>(false);
  contactInView$ = this.contactInViewSubject.asObservable();

  setContactInView(inView: boolean) {
    this.contactInViewSubject.next(inView);
  }
}
