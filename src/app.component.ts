import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { IotDataService } from './services/iot-data.service';

// New Components
import { HeaderComponent } from './components/header/header.component';
import { MetricCardComponent } from './components/metric-card/metric-card.component';
import { FlowChartComponent } from './components/flow-chart/flow-chart.component';
import { StopSelectorComponent } from './components/stop-selector/stop-selector.component';
import { CameraFeedComponent } from './components/camera-feed/camera-feed.component';
import { MapComponent } from './components/map/map.component';
import { RankingListComponent } from './components/ranking-list/ranking-list.component';
import { AiInsightsComponent } from './components/ai-insights/ai-insights.component';
import { BusEtaComponent } from './components/bus-eta/bus-eta.component';

interface Metric {
  title: string;
  value: string;
  icon: string;
  color: string;
  change?: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeaderComponent, 
    MetricCardComponent, 
    FlowChartComponent, 
    CameraFeedComponent,
    StopSelectorComponent,
    MapComponent,
    RankingListComponent,
    AiInsightsComponent,
    BusEtaComponent
  ],
})
export class AppComponent {
  private iotDataService = inject(IotDataService);
  
  allStops = this.iotDataService.allStopsData;
  allBuses = this.iotDataService.allBusesData;
  aiInsight = this.iotDataService.aiInsight;
  selectedStopId = this.iotDataService.selectedStopId;

  latestData = this.iotDataService.latestStopData;
  flowHistory = this.iotDataService.flowHistory;
  
  address = computed(() => this.latestData()?.location.address);
  cameras = computed(() => this.latestData()?.cameras);
  eta = computed(() => this.latestData()?.etaMinutes);

  showCameras = signal(false);

  private metrics = computed(() => {
    const latest = this.latestData();
    if (!latest) {
      return { current: 0, vsWeek: 0, vsMonth: 0 };
    }
    
    const vsWeek = ((latest.personCount - latest.historical.lastWeek) / latest.historical.lastWeek) * 100;
    const vsMonth = ((latest.personCount - latest.historical.lastMonth) / latest.historical.lastMonth) * 100;

    return {
      current: latest.personCount,
      vsWeek: isFinite(vsWeek) ? vsWeek : 0,
      vsMonth: isFinite(vsMonth) ? vsMonth : 0,
    };
  });

  dashboardMetrics = computed<Metric[]>(() => {
    const stats = this.metrics();
    return [
      {
        title: 'Ocupación Actual',
        value: stats.current.toString(),
        icon: 'users',
        color: 'text-blue-400',
      },
      {
        title: 'vs. Semana Pasada',
        value: `${stats.vsWeek.toFixed(1)}%`,
        icon: 'chart-bar',
        color: stats.vsWeek >= 0 ? 'text-red-400' : 'text-green-400',
        change: stats.vsWeek
      },
      {
        title: 'vs. Mes Pasado',
        value: `${stats.vsMonth.toFixed(1)}%`,
        icon: 'chart-bar',
        color: stats.vsMonth >= 0 ? 'text-red-400' : 'text-green-400',
        change: stats.vsMonth,
      }
    ];
  });

  onStopSelected(stopId: string): void {
    this.iotDataService.selectStop(stopId);
  }
}