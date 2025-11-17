import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-header',
  template: `
    <header class="bg-gray-800/30 backdrop-blur-sm border-b border-gray-700 shadow-md">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <svg class="h-8 w-8 text-blue-400 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h1 class="text-2xl font-bold text-white">ParaderoCast</h1>
            @if (address()) {
              <span class="ml-4 text-lg text-gray-400 font-light hidden sm:inline">{{ address() }}</span>
            } @else {
              <span class="ml-4 text-lg text-gray-400 font-light hidden sm:inline">Análisis de Flujo de Personas</span>
            }
          </div>
          <div class="flex items-center">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span class="ml-3 text-green-400 font-semibold">LIVE</span>
          </div>
        </div>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  address = input<string | undefined>();
}