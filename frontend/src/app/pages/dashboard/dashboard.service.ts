import { computed, effect, Injectable, signal } from '@angular/core';

export interface DashboardWidget {
    id: string; // unique UUID
    type: string; // e.g., 'sonarr-calendar', 'radarr-recent'
    serviceId?: number | string; // number for services, string for generic types
    cols: number;
    rows: number;
    x: number;
    y: number;
    title?: string;
    icon?: string;
}

const DEFAULT_WIDGETS: DashboardWidget[] = []; // Initial empty, will be populated if services exist

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    readonly widgets = signal<DashboardWidget[]>([]);
    readonly editMode = signal<boolean>(false);

    constructor() {
        this.loadLayout();

        // Auto-save whenever widgets change
        effect(() => {
            this.saveLayout();
        });
    }

    toggleEditMode() {
        this.editMode.update(v => !v);
    }

    addWidget(widget: Partial<DashboardWidget>) {
        const newWidget: DashboardWidget = {
            id: crypto.randomUUID(),
            x: 0,
            y: 0,
            cols: 1,
            rows: 1,
            type: 'unknown',
            ...widget,
        };

        this.widgets.update(current => [...current, newWidget]);
    }

    removeWidget(id: string) {
        this.widgets.update(current => current.filter(w => w.id !== id));
    }

    updateWidgetPosition(item: DashboardWidget) {
        this.widgets.update(current => {
            return current.map(w => {
                if (w.id === item.id) {
                    return { ...w, x: item.x, y: item.y, cols: item.cols, rows: item.rows };
                }
                return w;
            });
        });
    }

    saveLayout() {
        localStorage.setItem('arrdeck_dashboard_layout_v2', JSON.stringify(this.widgets()));
    }

    loadLayout() {
        const stored = localStorage.getItem('arrdeck_dashboard_layout_v2');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    this.widgets.set(parsed);
                    return;
                }
            } catch (e) {
                console.error('Failed to parse dashboard layout', e);
            }
        }
    }
}
