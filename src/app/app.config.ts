import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { DotDateFormatter } from './services/dot-date-formatter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: NgbDateParserFormatter, useClass: DotDateFormatter },
  ],
};
