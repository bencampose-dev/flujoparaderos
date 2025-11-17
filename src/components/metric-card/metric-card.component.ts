import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'app-metric-card',
  template: `
    <div class="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg p-5 flex items-center space-x-4 transition-all duration-300 hover:bg-gray-700/60 hover:shadow-xl">
      <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" [class]="iconClasses()">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" [innerHTML]="getIconPath()"></svg>
      </div>
      <div class="flex-grow">
        <p class="text-sm text-gray-400 font-medium">{{ title() }}</p>
        <div class="flex items-baseline space-x-2">
            <p class="text-2xl font-bold text-white">{{ value() }}</p>
            @if (change() !== undefined) {
                <div class="flex items-center" [class]="change()! >= 0 ? 'text-red-400' : 'text-green-400'">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        @if (change()! >= 0) {
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        } @else {
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                        }
                    </svg>
                </div>
            }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricCardComponent {
  title = input.required<string>();
  value = input.required<string>();
  icon = input.required<string>(); // 'users', 'trending-up', 'clock', 'chart-bar'
  colorClass = input<string>('text-gray-400');
  change = input<number | undefined>();

  iconClasses = computed(() => {
    const textColor = this.colorClass();
    const bgMap: Record<string, string> = {
      'text-blue-400': 'bg-blue-500/10',
      'text-yellow-400': 'bg-yellow-500/10',
      'text-red-400': 'bg-red-500/10',
      'text-orange-400': 'bg-orange-500/10',
      'text-green-400': 'bg-green-500/10',
      'text-indigo-400': 'bg-indigo-500/10',
      'text-gray-400': 'bg-gray-500/10',
    };
    const bgColor = bgMap[textColor] ?? 'bg-gray-500/10';
    return `${bgColor} ${textColor}`;
  });

  getIconPath(): string {
    const icons: { [key: string]: string } = {
      users: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />',
      'trending-up': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />',
      clock: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />',
      'chart-bar': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />',
    };
    return icons[this.icon()] || '';
  }
}