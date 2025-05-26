import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
} from '@angular/core';
import { DragStateService } from '../services/drag-state.service';

@Directive({
  selector: '[appAutoScroll]',
})
export class AutoScrollDirective implements OnDestroy {
  @Input() scrollSpeed = 20; // pixels per interval
  @Input() edgeThreshold = 60; // px from edge to start scrolling

  private intervalId: any = null;

  constructor(private el: ElementRef, private dragState: DragStateService) {}

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.dragState.dragging) {
      this.clearScroll();
      return;
    }
    const container = this.el.nativeElement as HTMLElement;
    const rect = container.getBoundingClientRect();

    // Only scroll if mouse is inside the container vertically
    if (event.clientY < rect.top || event.clientY > rect.bottom) {
      this.clearScroll();
      return;
    }

    // Scroll right
    if (event.clientX > rect.right - this.edgeThreshold) {
      this.startScroll('right', container);
    }
    // Scroll left
    else if (event.clientX < rect.left + this.edgeThreshold) {
      this.startScroll('left', container);
    } else {
      this.clearScroll();
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.clearScroll();
  }

  private startScroll(direction: 'left' | 'right', container: HTMLElement) {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      if (direction === 'right') {
        container.scrollLeft += this.scrollSpeed;
      } else {
        container.scrollLeft -= this.scrollSpeed;
      }
    }, 16); // ~60fps
  }

  private clearScroll() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  ngOnDestroy() {
    this.clearScroll();
  }
}
