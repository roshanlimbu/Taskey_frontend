import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DragStateService {
  private draggingSubject = new BehaviorSubject<boolean>(false);
  dragging$ = this.draggingSubject.asObservable();

  setDragging(isDragging: boolean) {
    this.draggingSubject.next(isDragging);
  }
  get dragging() {
    return this.draggingSubject.value;
  }
}
