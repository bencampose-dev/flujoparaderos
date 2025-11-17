import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { StopData } from '../../services/iot-data.service';

@Component({
  selector: 'app-stop-selector',
  template: `
    <div class="mb-6">
      <h2 class="text-lg font-semibold text-gray-300 mb-3">Seleccionar Paradero</h2>
      <div class="flex flex-wrap gap-3">
        @for(stop of stops(); track stop.stopId) {
          <button 
            (click)="stopSelected.emit(stop.stopId)"
            class="flex-grow sm:flex-grow-0 flex items-center justify-between p-3 rounded-lg border transition-all duration-200 w-full sm:w-auto"
            [class]="stop.stopId === selectedStopId() 
              ? 'bg-blue-500 border-blue-400 text-white shadow-lg scale-105' 
              : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500'">
            <div class="text-left">
              <p class="font-semibold text-sm">{{ stop.location.address }}</p>
              <p class="text-xs" [class]="stop.stopId === selectedStopId() ? 'text-blue-100' : 'text-gray-400'">
                Nivel de Flujo: <span class="font-bold uppercase">{{ stop.status }}</span>
              </p>
            </div>
            <div class="ml-4 pl-4 border-l flex flex-col items-center" [class]="stop.stopId === selectedStopId() ? 'border-blue-300' : 'border-gray-500'">
              <span class="text-2xl font-bold">{{ stop.personCount }}</span>
              <span class="text-xs uppercase text-gray-300">Personas</span>
            </div>
          </button>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StopSelectorComponent {
  stops = input.required<StopData[]>();
  selectedStopId = input.required<string | null>();
  stopSelected = output<string>();
}
