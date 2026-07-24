import { Component, ElementRef, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-alert-modal',
  templateUrl: './alert-modal.component.html',
  styleUrls: ['./alert-modal.component.scss'],
})
export class AlertModalComponent {
  isVisible: boolean = false;
  content: string = '';
  showbutton: boolean = false;
  onbutton: boolean = false;
  callback?: () => void; // Optional callback function
  constructor(private renderer: Renderer2, private elRef: ElementRef) { }
  openModal(message: string, showbutton?: boolean, callback?: () => void): void {
    this.content = message;
    if (showbutton) {
      this.showbutton = showbutton;
    }
    this.callback = callback; // Store the callback
    this.isVisible = true;

    // Wait for content to render
    setTimeout(() => {
      this.attachEventListeners();
    }, 0);
  }
  executeCallback(): void {
    if (this.callback && this.onbutton == true) {
      this.callback();
    }
    this.closeModal();
  }

  attachEventListeners(): void {
    // Find specific buttons or elements dynamically
    const dynamicButton = this.elRef.nativeElement.querySelector('#dynamicButton');
    if (dynamicButton) {
      this.renderer.listen(dynamicButton, 'click', () => {
        //console.log('Dynamic Button Clicked');
        this.executeCallback(); // Execute the callback if required
      });
    }
  }
  closeModal(): void {
    this.isVisible = false;
    if (this.callback && this.onbutton == false) {
      this.callback(); // Execute the callback if provided
    }
  }
}
