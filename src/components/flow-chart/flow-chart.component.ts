import { Component, ChangeDetectionStrategy, input, viewChild, ElementRef, effect } from '@angular/core';
import { FlowData } from '../../services/iot-data.service';

// Use a global d3 from the CDN script
declare var d3: any;

@Component({
  selector: 'app-flow-chart',
  template: `
    <div class="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg p-4 sm:p-6 h-full flex flex-col">
      <h2 class="text-xl font-semibold text-white mb-4">{{ title() }}</h2>
      <div #chartContainer class="w-full flex-grow relative"></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'onResize()'
  }
})
export class FlowChartComponent {
  data = input.required<FlowData[]>();
  title = input<string>('Flujo de Personas (Promedio 10 min)');
  chartContainer = viewChild.required<ElementRef>('chartContainer');

  constructor() {
    effect(() => {
      const currentData = this.data();
      if (currentData && currentData.length > 1 && this.chartContainer()) {
        const aggregatedData = this.aggregateDataByInterval(currentData, 10);
        this.drawChart(aggregatedData);
      }
    }, { allowSignalWrites: true });
  }

  onResize(): void {
    const currentData = this.data();
    if (currentData && currentData.length > 1 && this.chartContainer()) {
      const aggregatedData = this.aggregateDataByInterval(currentData, 10);
      this.drawChart(aggregatedData);
    }
  }

  private aggregateDataByInterval(data: FlowData[], intervalMinutes: number): FlowData[] {
    if (!data || data.length === 0) {
      return [];
    }

    const buckets = new Map<number, { sum: number; countOfItems: number }>();
    const intervalMs = intervalMinutes * 60 * 1000;

    for (const d of data) {
      const timestamp = d.timestamp.getTime();
      const intervalStart = Math.floor(timestamp / intervalMs) * intervalMs;
      
      const bucket = buckets.get(intervalStart);
      if (bucket) {
        bucket.sum += d.count;
        bucket.countOfItems += 1;
      } else {
        buckets.set(intervalStart, { sum: d.count, countOfItems: 1 });
      }
    }

    const aggregatedData: FlowData[] = [];
    for (const [timestamp, { sum, countOfItems }] of buckets.entries()) {
      aggregatedData.push({
        timestamp: new Date(timestamp),
        count: Math.round(sum / countOfItems),
      });
    }

    return aggregatedData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private drawChart(data: FlowData[]): void {
    if (data.length < 2) return;
    const element = this.chartContainer().nativeElement;
    d3.select(element).select('svg').remove();
    d3.select(element).select('.flow-tooltip').remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = element.offsetHeight - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    const svg = d3.select(element)
      .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain(d3.extent(data, (d: FlowData) => d.timestamp) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, Math.max(10, (d3.max(data, (d: FlowData) => d.count) as number) * 1.2)])
      .range([height, 0]);

    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "flowGradient")
      .attr("x1", "0%").attr("x2", "0%").attr("y1", "0%").attr("y2", "100%");
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "rgb(56 189 248)")
      .attr("stop-opacity", 0.6);
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "rgb(56 189 248)")
      .attr("stop-opacity", 0);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(Math.max(width / 100, 2)).tickFormat(d3.timeFormat("%H:%M")))
      .call((g: any) => g.select(".domain").remove())
      .call((g: any) => g.selectAll("line").remove())
      .call((g: any) => g.selectAll("text")
        .attr("fill", "#9ca3af")
        .style("font-size", "12px"));

    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width))
      .call((g: any) => g.select(".domain").remove())
      .call((g: any) => g.selectAll('.tick line')
        .attr('stroke', '#4b5563')
        .attr('stroke-opacity', 0.2))
      .call((g: any) => g.selectAll('.tick text')
        .attr('fill', '#9ca3af')
        .attr('x', -10)
        .style('font-size', '12px'));

    const area = d3.area()
      .x((d: any) => x(d.timestamp))
      .y0(height)
      .y1((d: any) => y(d.count))
      .curve(d3.curveMonotoneX);
    svg.append('path')
      .datum(data)
      .attr('fill', 'url(#flowGradient)')
      .attr('d', area);

    const line = d3.line()
      .x((d: any) => x(d.timestamp))
      .y((d: any) => y(d.count))
      .curve(d3.curveMonotoneX);
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'rgb(56 189 248)')
      .attr('stroke-width', 3)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', line);

    const tooltip = d3.select(element).append('div')
      .attr('class', 'flow-tooltip absolute invisible bg-gray-900/70 backdrop-blur-sm border border-gray-700 text-gray-200 text-xs rounded-lg shadow-xl p-2 pointer-events-none transition-opacity duration-200')
      .style('opacity', 0);

    const focus = svg.append('g').style('display', 'none');
    focus.append('line')
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#9ca3af')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');
    focus.append('circle')
      .attr('r', 8)
      .attr('fill', 'rgb(56 189 248)')
      .attr('fill-opacity', 0.2);
    focus.append('circle')
      .attr('r', 4)
      .attr('fill', 'rgb(56 189 248)')
      .attr('stroke', '#111827')
      .attr('stroke-width', 2);

    const bisectDate = d3.bisector((d: FlowData) => d.timestamp).left;

    svg.append('rect')
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .attr('width', width)
      .attr('height', height)
      .on('mouseover', () => {
        focus.style('display', null);
        tooltip.style('opacity', 1).style('visibility', 'visible');
      })
      .on('mouseout', () => {
        focus.style('display', 'none');
        tooltip.style('opacity', 0).style('visibility', 'hidden');
      })
      .on('mousemove', (event: MouseEvent) => {
        const [pointerX] = d3.pointer(event);
        const x0 = x.invert(pointerX);
        const i = bisectDate(data, x0, 1);
        const d0 = data[i - 1];
        const d1 = data[i];
        if (!d0 || !d1) return;
        
        const d = x0.getTime() - d0.timestamp.getTime() > d1.timestamp.getTime() - x0.getTime() ? d1 : d0;
        
        focus.attr('transform', `translate(${x(d.timestamp)},${y(d.count)})`);
        
        const timeFormat = d3.timeFormat("%H:%M");
        tooltip.html(
          `<div class="font-bold text-center text-white">${d.count} Personas (Promedio)</div>` +
          `<div class="text-gray-400 text-center">Intervalo de ${timeFormat(d.timestamp)}</div>`
        );

        const tooltipX = x(d.timestamp) + margin.left;
        const tooltipY = y(d.count) + margin.top;
        const tooltipWidth = (tooltip.node() as HTMLElement).offsetWidth;
        const tooltipHeight = (tooltip.node() as HTMLElement).offsetHeight;

        let left = tooltipX - (tooltipWidth / 2);
        let top = tooltipY - tooltipHeight - 15;

        if (left < 0) left = 5;
        if (left + tooltipWidth > element.offsetWidth) left = element.offsetWidth - tooltipWidth - 5;
        if (top < 0) top = tooltipY + 20;

        tooltip
          .style('left', `${left}px`)
          .style('top', `${top}px`);
      });
  }
}