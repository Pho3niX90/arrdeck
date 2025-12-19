import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
    selector: '[appHorizontalScroll]',
    standalone: true
})
export class HorizontalScrollDirective {
    constructor(private el: ElementRef) { }

    @HostListener('wheel', ['$event'])
    onWheel(event: WheelEvent) {
        if (event.deltaY !== 0) {
            event.preventDefault();
            this.el.nativeElement.scrollLeft += event.deltaY + event.deltaX;
        }
    }
}
