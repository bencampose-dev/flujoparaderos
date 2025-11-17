import { Injectable, signal, computed } from '@angular/core';

export interface FlowData {
  timestamp: Date;
  count: number;
}

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

const MAX_DATA_POINTS = 50;

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

  private _flowHistories = signal<Map<string, FlowData[]>>(new Map());

  private _selectedStopId = signal<string | null>(null);
  public readonly selectedStopId = this._selectedStopId.asReadonly();

  public readonly latestStopData = computed(() => {
    const selectedId = this._selectedStopId();
    const allData = this._allStopsData();
    if (!selectedId || allData.length === 0) return null;
    return allData.find(stop => stop.stopId === selectedId) ?? null;
  });

  public readonly flowHistory = computed(() => {
    const selectedId = this._selectedStopId();
    const histories = this._flowHistories();
    if (!selectedId) return [];
    return histories.get(selectedId) || [];
  });

  private stopDefinitions = [
    { stopId: "stop-g4a1k", address: "Av. Principal 123, Santiago", lat: -33.4567, lng: -70.6789 },
    { stopId: "stop-b2c3d", address: "Calle Central 456, Valparaíso", lat: -33.0458, lng: -71.6197 },
    { stopId: "stop-f9h8j", address: "Plaza de Armas 789, Concepción", lat: -36.8269, lng: -73.0498 }
  ];
  
  // Simple bus route simulation
  // Fix: The stopDefinitions objects contain lat/lng directly, not within a 'location' property.
  private busRoutes = {
      'R1': [this.stopDefinitions[0], this.stopDefinitions[1], this.stopDefinitions[0]],
      'R2': [this.stopDefinitions[1], this.stopDefinitions[2], this.stopDefinitions[1]],
  };
  
  private busState = [
      { busId: 'bus-01', routeId: 'R1', progress: 0, segment: 0 },
      { busId: 'bus-02', routeId: 'R1', progress: 0.5, segment: 0 },
      { busId: 'bus-03', routeId: 'R2', progress: 0.2, segment: 0 },
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

      this._flowHistories.update(currentHistories => {
        allStops.forEach(stopData => {
          const history = currentHistories.get(stopData.stopId) || [];
          const newFlowData: FlowData = {
            timestamp: new Date(stopData.timestamp),
            count: stopData.personCount
          };
          const updatedHistory = [...history, newFlowData];
          if (updatedHistory.length > MAX_DATA_POINTS) {
            currentHistories.set(stopData.stopId, updatedHistory.slice(-MAX_DATA_POINTS));
          } else {
            currentHistories.set(stopData.stopId, updatedHistory);
          }
        });
        return new Map(currentHistories);
      });

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
          const route = this.busRoutes[bus.routeId as 'R1' | 'R2'];
          if (bus.progress >= 1) {
              bus.progress = 0;
              bus.segment = (bus.segment + 1) % (route.length -1);
          }
      });
  }

  private getMockBusesData(): Bus[] {
      return this.busState.map(bus => {
          const route = this.busRoutes[bus.routeId as 'R1' | 'R2'];
          const start = route[bus.segment];
          const end = route[bus.segment + 1];

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