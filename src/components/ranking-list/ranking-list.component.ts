import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { StopData } from '../../services/iot-data.service';

@Component({
  selector: 'app-ranking-list',
  template: `
    <div class="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg p-5 flex flex-col h-full">
      <h3 class="text-lg font-semibold text-white mb-4">Paraderos con Mayor Flujo</h3>
      <div class="flex-grow space-y-3 pr-2 -mr-2 overflow-y-auto">
        @for(stop of rankedStops(); track stop.stopId; let i = $index) {
          <div class="flex items-center justify-between p-3 rounded-lg" [class]="getRankBg(i)">
            <div class="flex items-center">
              <span class="text-sm font-bold w-6 text-center" [class]="getRankColor(i)">{{ i + 1 }}</span>
              <div class="ml-3">
                <p class="text-sm font-semibold text-gray-200 truncate max-w-[150px]">{{ stop.location.address }}</p>
                <p class="text-xs text-gray-400">Nivel: <span class="font-bold uppercase">{{ stop.status }}</span></p>
              </div>
            </div>
            <div class="flex flex-col items-end">
              <span class="text-lg font-bold text-white">{{ stop.personCount }}</span>
              <span class="text-xs text-gray-400 -mt-1">personas</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankingListComponent {
  stops = input.required<StopData[]>();

  rankedStops = computed(() => {
    return [...this.stops()]
      .sort((a, b) => b.personCount - a.personCount)
      .slice(0, 5); // Show top 5
  });

  getRankColor(index: number): string {
    if (index === 0) return 'text-yellow-300';
    if (index === 1) return 'text-gray-300';
    if (index === 2) return 'text-orange-400';
    return 'text-gray-400';
  }

  getRankBg(index: number): string {
    if (index === 0) return 'bg-yellow-500/10';
    if (index === 1) return 'bg-gray-500/10';
    if (index === 2) return 'bg-orange-500/10';
    return 'bg-gray-500/5';
  }
}