import { Component, ChangeDetectionStrategy, input, viewChild, ElementRef, effect } from '@angular/core';
import { FlowData } from '../../services/iot-data.service';

// Use a global d3 from the CDN script
declare var d3: any;

@Component({
  selector: 'app-flow-chart',
  template: `
    <div class="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg p-4 sm:p-6 h-full flex flex-col">
      <h2 class="text-xl font-semibold text-white mb-4">{{ title() }}</h2>
      <div #chartContainer class="w-full flex-grow"></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowChartComponent {
  data = input.required<FlowData[]>();
  title = input<string>('Flujo de Personas en Tiempo Real');
  chartContainer = viewChild.required<ElementRef>('chartContainer');

  constructor() {
    effect(() => {
      const currentData = this.data();
      if (currentData && currentData.length > 1 && this.chartContainer()) {
        this.drawChart(currentData);
      }
    }, { allowSignalWrites: true });
  }

  private drawChart(data: FlowData[]): void {
    const element = this.chartContainer().nativeElement;
    d3.select(element).select('svg').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = element.offsetHeight - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define gradient
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", "svgGradient")
        .attr("x1", "0%")
        .attr("x2", "0%")
        .attr("y1", "0%")
        .attr("y2", "100%");
    gradient.append("stop")
        .attr('class', 'start')
        .attr("offset", "0%")
        .attr("stop-color", "#38bdf8")
        .attr("stop-opacity", 0.4);
    gradient.append("stop")
        .attr('class', 'end')
        .attr("offset", "100%")
        .attr("stop-color", "#38bdf8")
        .attr("stop-opacity", 0);


    const x = d3.scaleTime()
      .domain(d3.extent(data, (d: FlowData) => d.timestamp) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, (d: FlowData) => d.count) as number * 1.2])
      .range([height, 0]);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%H:%M")))
      .selectAll("text")
        .style("fill", "#9ca3af");

    svg.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
        .style("fill", "#9ca3af");

    // FIX: Removed generic type argument from d3.area() as d3 is of type 'any'.
    const area = d3.area()
      .x((d: FlowData) => x(d.timestamp))
      .y0(height)
      .y1((d: FlowData) => y(d.count))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'url(#svgGradient)')
      .attr('d', area);
      
    // FIX: Removed generic type argument from d3.line() as d3 is of type 'any'.
    const line = d3.line()
      .x((d: FlowData) => x(d.timestamp))
      .y((d: FlowData) => y(d.count))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2)
      .attr('d', line);
  }
}