import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-bus-eta',
  template: `
    <div class="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg p-5 flex flex-col justify-between h-full">
      <div>
        <h3 class="text-lg font-semibold text-white mb-2">Próximo Autobús</h3>
        @if (etaMinutes() !== undefined && etaMinutes() !== null) {
          <p class="text-5xl font-bold text-sky-400">{{ etaMinutes() }} <span class="text-2xl text-gray-400 font-medium">min</span></p>
        } @else {
          <p class="text-lg text-gray-400">No disponible</p>
        }
      </div>
      <button (click)="viewCameras.emit()" class="mt-4 w-full flex items-center justify-center gap-2 bg-gray-700/80 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 border border-gray-600">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.55a2 2 0 01.99 1.67V14a2 2 0 01-2 2h-4.55a2 2 0 01-1.99-1.67L9 6a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h2" />
        </svg>
        Ver Cámaras
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusEtaComponent {
  etaMinutes = input<number | null | undefined>();
  viewCameras = output<void>();
}
