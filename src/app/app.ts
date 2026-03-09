import { Component } from '@angular/core';
import { TimelineComponent } from './components/timeline/timeline.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TimelineComponent],
  template: `<app-timeline></app-timeline>`,
  styles: [`:host { display: block; }`],
})
export class App {}
