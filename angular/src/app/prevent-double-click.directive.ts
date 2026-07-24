import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[preventDoubleClick]'
})
export class PreventDoubleClickDirective {

  @HostListener('dblclick', ['$event'])
  onDoubleClick(event: MouseEvent) {
    event.preventDefault();
  }

}
