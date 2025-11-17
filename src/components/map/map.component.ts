import { Component, ChangeDetectionStrategy, input, output, viewChild, ElementRef, effect, OnDestroy, AfterViewInit } from '@angular/core';
import { StopData, Bus } from '../../services/iot-data.service';

declare var L: any; // Use a global L from the Leaflet CDN script

export interface BusRoute {
  routeId: string;
  coordinates: { lat: number; lng: number }[];
}

@Component({
  selector: 'app-map',
  template: `<div #mapContainer class="w-full h-full rounded-xl border border-gray-700"></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements OnDestroy, AfterViewInit {
  stops = input.required<StopData[]>();
  buses = input.required<Bus[]>();
  routes = input<BusRoute[]>([]);
  selectedStopId = input.required<string | null>();
  stopSelected = output<string>();

  mapContainer = viewChild.required<ElementRef>('mapContainer');

  private map: any;
  private stopMarkers = new Map<string, any>();
  private busMarkers = new Map<string, any>();
  private routeLayers = new Map<string, any>();

  private busIcon = L.divIcon({
      html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-white"><path d="M12 24a12 12 0 0 1-12-12 12 12 0 0 1 12-12 12 12 0 0 1 12 12 12 12 0 0 1-12 12zM18.1 13.94a.5.5 0 0 0-.5-.44H6.4a.5.5 0 0 0-.5.44l-1.12 4.46a.5.5 0 0 0 .44.56h1.36a.5.5 0 0 0 .5-.44l.36-1.44h10.12l.36 1.44a.5.5 0 0 0 .5.44h1.36a.5.5 0 0 0 .44-.56zM8.5 16a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm7 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM18 10.5a.5.5 0 0 0-.5-.5H6.5a.5.5 0 0 0-.5.5v2h12zM17 4H7a2 2 0 0 0-2 2v3h14V6a2 2 0 0 0-2-2z"/></svg>`,
      className: 'bg-blue-500 rounded-full shadow-lg p-1 border-2 border-white',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
  });

  constructor() {
    effect(() => this.updateStopMarkers(), { allowSignalWrites: true });
    effect(() => this.updateBusMarkers());
    effect(() => this.updateRoutes());
    effect(() => this.updateSelectedStopView());
  }
  
  ngAfterViewInit(): void {
    this.initMap();
    // Use a timeout to ensure the map container has been sized by the browser's layout engine.
    // This fixes the common Leaflet issue where only part of the map is rendered.
    setTimeout(() => {
        this.map?.invalidateSize();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer().nativeElement, {
        center: [-33.4567, -70.6789], // Center on Santiago initially
        zoom: 13,
        zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(this.map);
  }

  private updateStopMarkers(): void {
    if (!this.map) return;
    const stopsData = this.stops();
    const currentStopIds = new Set(stopsData.map(s => s.stopId));

    stopsData.forEach(stop => {
      const { lat, lng } = stop.location;
      
      const color = stop.status === 'high' ? '#f87171' : stop.status === 'medium' ? '#fb923c' : '#4ade80';
      const radius = 6 + (stop.personCount / 10);

      let marker = this.stopMarkers.get(stop.stopId);
      if (marker) {
        marker.setLatLng([lat, lng]).setRadius(radius).setStyle({ color });
      } else {
        marker = L.circleMarker([lat, lng], {
          radius: radius,
          fillColor: color,
          color: color,
          weight: 2,
          opacity: 1,
          fillOpacity: 0.6
        }).addTo(this.map);
        marker.on('click', () => this.stopSelected.emit(stop.stopId));
        this.stopMarkers.set(stop.stopId, marker);
      }
    });

    // Remove old markers if stops are removed dynamically
    this.stopMarkers.forEach((marker, stopId) => {
        if (!currentStopIds.has(stopId)) {
            this.map.removeLayer(marker);
            this.stopMarkers.delete(stopId);
        }
    });
  }
  
  private updateBusMarkers(): void {
    if (!this.map) return;
    const busesData = this.buses();
    const currentBusIds = new Set(busesData.map(b => b.busId));

    // Update existing or add new markers
    busesData.forEach(bus => {
        const { lat, lng } = bus.location;
        let marker = this.busMarkers.get(bus.busId);
        if(marker) {
            marker.setLatLng([lat, lng]);
        } else {
            marker = L.marker([lat, lng], { icon: this.busIcon }).addTo(this.map);
            this.busMarkers.set(bus.busId, marker);
        }
    });

    // Remove old markers
    this.busMarkers.forEach((marker, busId) => {
        if (!currentBusIds.has(busId)) {
            this.map.removeLayer(marker);
            this.busMarkers.delete(busId);
        }
    });
  }

  private updateRoutes(): void {
    if (!this.map) return;
    const routesData = this.routes();
    const currentRouteIds = new Set(routesData.map(r => r.routeId));

    // Remove old polylines
    this.routeLayers.forEach((layer, routeId) => {
      if (!currentRouteIds.has(routeId)) {
        this.map.removeLayer(layer);
        this.routeLayers.delete(routeId);
      }
    });

    // Add new or update existing polylines
    routesData.forEach(route => {
      const latLngs = route.coordinates.map(c => [c.lat, c.lng]);
      let polyline = this.routeLayers.get(route.routeId);
      if (polyline) {
        polyline.setLatLngs(latLngs);
      } else {
        polyline = L.polyline(latLngs, {
          color: '#38bdf8', // sky-400
          weight: 3,
          opacity: 0.7,
          dashArray: '5, 10'
        }).addTo(this.map);
        this.routeLayers.set(route.routeId, polyline);
      }
    });
  }

  private updateSelectedStopView(): void {
      const selectedId = this.selectedStopId();
      if (!this.map || !selectedId) return;

      const stop = this.stops().find(s => s.stopId === selectedId);
      if(stop) {
          this.map.flyTo([stop.location.lat, stop.location.lng], 15, { duration: 1 });
      }

      this.stopMarkers.forEach((marker, stopId) => {
          const s = this.stops().find(s => s.stopId === stopId);
          if (s) {
              const weight = stopId === selectedId ? 4 : 2;
              const opacity = stopId === selectedId ? 1 : 0.6;
              const color = s.status === 'high' ? '#f87171' : s.status === 'medium' ? '#fb923c' : '#4ade80';
              marker.setStyle({ weight, color, opacity });
          }
      });
  }
}