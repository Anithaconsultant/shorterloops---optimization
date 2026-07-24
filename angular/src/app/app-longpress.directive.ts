import { Directive, EventEmitter, HostBinding, HostListener, Output } from '@angular/core';
import { CdkDrag } from '@angular/cdk/drag-drop';

@Directive({
  selector: '[longPressDrag]'
})
export class LongPressDragDirective extends CdkDrag {
  // Event emitter for initiating drag
  @Output() longPressStart: EventEmitter<any> = new EventEmitter();

  private timeout: any;


  // Listen for mouse down event
  @HostListener('mousedown', ['$event'])
  onMouseDown(event:any) {
    this.timeout = setTimeout(() => {
      this.longPressStart.emit(event);
    }, 250); // Adjust the duration as needed
  }

  // Cancel timeout on mouse up event
  @HostListener('mouseup')
  onMouseUp() {
    clearTimeout(this.timeout);
  }

  // Cancel timeout on mouse leave event
  @HostListener('mouseleave')
  onMouseLeave() {
    clearTimeout(this.timeout);
  }
}
