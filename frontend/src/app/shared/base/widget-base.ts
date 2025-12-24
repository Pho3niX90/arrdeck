import {Directive, input} from '@angular/core';

@Directive()
export abstract class WidgetBase {
  rows = input(1);
  cols = input(1);
  serviceId = input.required<number>();
}
