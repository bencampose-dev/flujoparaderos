import { Injectable, signal, computed } from '@angular/core';

export interface Camera {
  cameraId: string;
  status: 'online' | 'offline';
  url: string;
}

export interface Bus {
  busId: string;
  routeId: string;
  location: {
    lat: number;
    lng: number;
  };
}

export interface AiInsight {
    id: string;
    message: string;
    suggestion: string;
    severity: 'low' | 'medium' | 'high';
}

export interface StopData {
  stopId: string;
  timestamp: string; // ISO string
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  status: 'low' | 'medium' | 'high';
  personCount: number;
  avgWaitTimeMinutes: number;
  cameras: Camera[];
  etaMinutes: number;
  historical: {
      lastWeek: number;
      lastMonth: number;
  }
}

// FIX: Added missing FlowData interface used by FlowChartComponent.
export interface FlowData {
  timestamp: Date;
  count: number;
}

@Injectable({
  providedIn: 'root',
})
export class IotDataService {
  private _allStopsData = signal<StopData[]>([]);
  public readonly allStopsData = this._allStopsData.asReadonly();
  
  private _allBusesData = signal<Bus[]>([]);
  public readonly allBusesData = this._allBusesData.asReadonly();
  
  private _aiInsight = signal<AiInsight | null>(null);
  public readonly aiInsight = this._aiInsight.asReadonly();

  private _selectedStopId = signal<string | null>(null);
  public readonly selectedStopId = this._selectedStopId.asReadonly();

  public readonly latestStopData = computed(() => {
    const selectedId = this._selectedStopId();
    const allData = this._allStopsData();
    if (!selectedId || allData.length === 0) return null;
    return allData.find(stop => stop.stopId === selectedId) ?? null;
  });

  private stopDefinitions = [
    // Ruta Providencia (5 paradas)
    { stopId: "stop-prov-1", address: "Metro Tobalaba, Providencia", lat: -33.4180, lng: -70.5985 },
    { stopId: "stop-prov-2", address: "Metro Los Leones, Providencia", lat: -33.4215, lng: -70.6080 },
    { stopId: "stop-prov-3", address: "Metro Pedro de Valdivia", lat: -33.4248, lng: -70.6160 },
    { stopId: "stop-prov-4", address: "Metro Manuel Montt", lat: -33.4285, lng: -70.6245 },
    { stopId: "stop-prov-5", address: "Metro Salvador", lat: -33.4318, lng: -70.6310 },

    // Otras paradas en Santiago
    { stopId: "stop-stgo-1", address: "Plaza de Armas, Santiago", lat: -33.4379, lng: -70.6505 },
    { stopId: "stop-stgo-2", address: "Parque O'Higgins", lat: -33.4650, lng: -70.6580 },
    { stopId: "stop-stgo-3", address: "Metro La Cisterna", lat: -33.5350, lng: -70.6610 },
  ];
  
  private busRoutes: { [key: string]: string[] } = {
    'R1': ["stop-prov-1", "stop-prov-2", "stop-prov-3", "stop-prov-4", "stop-prov-5"],
  };
  
  public readonly busRouteCoordinates = computed(() => {
    const stopsMap = new Map(this.stopDefinitions.map(s => [s.stopId, {lat: s.lat, lng: s.lng}]));
    return Object.entries(this.busRoutes).map(([routeId, stopIds]) => {
      const coordinates = stopIds
        .map(stopId => stopsMap.get(stopId))
        .filter((coord): coord is {lat: number, lng: number} => coord !== undefined);
      return { routeId, coordinates };
    });
  });

  private busState = [
      { busId: 'bus-01', routeId: 'R1', progress: 0, segment: 0 },
      { busId: 'bus-02', routeId: 'R1', progress: 0.5, segment: 2 },
  ];

  constructor() {
    this.fetchData(); 
    setInterval(() => this.fetchData(), 5000);
  }

  selectStop(stopId: string): void {
    this._selectedStopId.set(stopId);
  }

  private async fetchData(): Promise<void> {
    try {
      this.updateBusLocations();
      const allStops = this.getMockStopsData();
      const allBuses = this.getMockBusesData();
      const insight = this.getMockAiInsight(allStops);

      this._allStopsData.set(allStops);
      this._allBusesData.set(allBuses);
      this._aiInsight.set(insight);

      if (!this._selectedStopId() && allStops.length > 0) {
        this._selectedStopId.set(allStops[0].stopId);
      }

    } catch (error) {
      console.error("Failed to fetch IoT data:", error);
    }
  }

  private getMockStopsData(): StopData[] {
    return this.stopDefinitions.map(def => {
      const personCount = Math.floor(Math.random() * 75) + 5;
      let status: 'low' | 'medium' | 'high' = 'low';
      if (personCount > 55) status = 'high';
      else if (personCount > 25) status = 'medium';
      
      return {
        stopId: def.stopId,
        location: { address: def.address, lat: def.lat, lng: def.lng },
        timestamp: new Date().toISOString(),
        status: status,
        personCount: personCount,
        avgWaitTimeMinutes: parseFloat((Math.random() * 12 + 4).toFixed(1)),
        etaMinutes: Math.floor(Math.random() * 10) + 2,
        historical: {
            lastWeek: Math.floor(personCount * (Math.random() * 0.4 + 0.8)), // +/- 20%
            lastMonth: Math.floor(personCount * (Math.random() * 0.6 + 0.7)), // +/- 30%
        },
        cameras: [
          { "cameraId": `${def.stopId}-cam-01`, "status": "online", "url": `https://loremflickr.com/640/480/bus,street?random=${Math.random()}` },
          { "cameraId": `${def.stopId}-cam-02`, "status": Math.random() > 0.85 ? 'offline' : 'online', "url": `https://loremflickr.com/640/480/people,street?random=${Math.random()}` }
        ]
      };
    });
  }
  
  private updateBusLocations() {
      const speed = 0.05; // progress per fetch
      this.busState.forEach(bus => {
          bus.progress += speed;
          const routeStops = this.busRoutes[bus.routeId];
          if (bus.progress >= 1) {
              bus.progress = 0;
              bus.segment = (bus.segment + 1) % (routeStops.length - 1);
          }
      });
  }

  private getMockBusesData(): Bus[] {
      const stopsMap = new Map(this.stopDefinitions.map(s => [s.stopId, s]));
      return this.busState.map(bus => {
          const routeStopIds = this.busRoutes[bus.routeId];
          const startStopId = routeStopIds[bus.segment];
          const endStopId = routeStopIds[bus.segment + 1];
          
          const start = stopsMap.get(startStopId);
          const end = stopsMap.get(endStopId);

          if (!start || !end) {
              // Fallback or error, return last known good location if any
              return { busId: bus.busId, routeId: bus.routeId, location: { lat: 0, lng: 0 }};
          }

          // Linear interpolation for bus position
          const lat = start.lat + (end.lat - start.lat) * bus.progress;
          const lng = start.lng + (end.lng - start.lng) * bus.progress;
          
          return { busId: bus.busId, routeId: bus.routeId, location: { lat, lng }};
      });
  }

  private getMockAiInsight(stops: StopData[]): AiInsight | null {
      const highFlowStop = stops.find(s => s.status === 'high' && s.personCount > 60);
      if (highFlowStop) {
          return {
              id: `insight-${highFlowStop.stopId}`,
              message: `Alta demanda detectada en ${highFlowStop.location.address}.`,
              suggestion: 'Considere despachar un bus de refuerzo a la ruta que sirve esta área.',
              severity: 'high'
          };
      }
      const mediumFlowStop = stops.find(s => s.status === 'medium' && s.personCount > 40);
      if (mediumFlowStop) {
           return {
              id: `insight-${mediumFlowStop.stopId}`,
              message: `Flujo de personas en aumento en ${mediumFlowStop.location.address}.`,
              suggestion: 'Monitorear la situación. El flujo podría alcanzar un nivel alto pronto.',
              severity: 'medium'
          };
      }
      return {
            id: 'insight-normal',
            message: 'Operaciones normales en toda la red.',
            suggestion: 'No se requieren acciones inmediatas. El sistema funciona de manera óptima.',
            severity: 'low'
      };
  }
}