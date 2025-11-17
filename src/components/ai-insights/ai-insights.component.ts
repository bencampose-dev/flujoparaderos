import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { AiInsight } from '../../services/iot-data.service';

@Component({
  selector: 'app-ai-insights',
  template: `
    <div class="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg p-5 flex flex-col h-full">
      <div class="flex items-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h3 class="text-lg font-semibold text-white">Análisis Predictivo (IA)</h3>
      </div>
      @if (insight(); as currentInsight) {
        <div class="flex-grow flex flex-col justify-center">
            <div class="flex items-start space-x-3 p-3 rounded-lg" [class]="severityClasses().bg">
                <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1" [class]="severityClasses().iconBg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" [class]="severityClasses().iconText" fill="none" viewBox="0 0 24 24" stroke="currentColor" [innerHTML]="severityClasses().iconPath"></svg>
                </div>
                <div>
                    <p class="font-semibold text-sm" [class]="severityClasses().text">{{ currentInsight.message }}</p>
                    <p class="text-xs text-gray-300 mt-1">{{ currentInsight.suggestion }}</p>
                </div>
            </div>
        </div>
      } @else {
        <div class="flex-grow flex items-center justify-center">
            <p class="text-gray-400 text-sm">No hay alertas activas.</p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiInsightsComponent {
    insight = input<AiInsight | null>();

    severityClasses = computed(() => {
        const severity = this.insight()?.severity ?? 'low';
        const classes = {
            high: {
                bg: 'bg-red-500/10', text: 'text-red-300', iconBg: 'bg-red-500/20', iconText: 'text-red-300',
                iconPath: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />'
            },
            medium: {
                bg: 'bg-yellow-500/10', text: 'text-yellow-300', iconBg: 'bg-yellow-500/20', iconText: 'text-yellow-300',
                iconPath: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />'
            },
            low: {
                bg: 'bg-green-500/10', text: 'text-green-300', iconBg: 'bg-green-500/20', iconText: 'text-green-300',
                iconPath: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />'
            }
        };
        return classes[severity];
    });
}
