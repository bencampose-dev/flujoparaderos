import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { Camera } from '../../services/iot-data.service';

@Component({
  selector: 'app-camera-feed',
  template: `
    <div class="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg p-4 sm:p-6 h-full">
      <h2 class="text-xl font-semibold text-white mb-4">Vistas de Cámara</h2>
      @if (!cameras() || cameras()?.length === 0) {
        <div class="flex items-center justify-center h-full">
         <p class="text-gray-400">No hay cámaras disponibles.</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-4">
          @for (camera of cameras(); track camera.cameraId) {
            <div class="relative rounded-lg overflow-hidden border-2" [class]="camera.status === 'online' ? 'border-green-500/50' : 'border-red-500/50'">
              <img [src]="camera.url" [alt]="camera.cameraId" class="w-full h-48 object-cover transition-transform duration-300 hover:scale-105" />
              <div class="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold" [class]="camera.status === 'online' ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'">
                {{ camera.status === 'online' ? 'EN LÍNEA' : 'FUERA DE LÍNEA' }}
              </div>
              <div class="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-white text-sm font-semibold">
                {{ camera.cameraId }}
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CameraFeedComponent {
  cameras = input<Camera[] | null | undefined>();
}
