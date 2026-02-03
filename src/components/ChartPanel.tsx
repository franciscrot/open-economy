import React from 'react';
import Tooltip from './Tooltip';
import { ModelState } from '../model/types';

type ChartPanelProps = {
  history: ModelState[];
  sectorNames: Record<string, string>;
};

const buildSparkline = (values: number[], width = 140, height = 40) => {
  if (values.length === 0) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });
  return points.join(' ');
};

const Sparkline: React.FC<{ values: number[]; label: string }> = ({ values, label }) => (
  <svg viewBox="0 0 140 40" role="img" aria-label={label}>
    <polyline points={buildSparkline(values)} fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const ChartPanel: React.FC<ChartPanelProps> = ({ history, sectorNames }) => {
  const wages = history.map((state) => state.wage);
  const innovation = history.map((state) => state.innovationRate);
  const diffusion = history.map((state) => state.diffusionRate);
  const inequality = history.map((state) => state.inequalityIndex);
  const welfare = history.map((state) => state.welfareIndex);
  const altWelfare = history.map((state) => state.alternativeWelfare);
  const outputA = history.map((state) => state.sectorOutputs.sectorA ?? 0);
  const outputB = history.map((state) => state.sectorOutputs.sectorB ?? 0);
  const priceA = history.map((state) => state.sectorPrices.sectorA ?? 0);
  const priceB = history.map((state) => state.sectorPrices.sectorB ?? 0);

  return (
    <section className="panel">
      <h2>Outcome Charts</h2>
      <p className="panel-intro">
        Track wages, prices, outputs, innovation, diffusion, inequality, and welfare metrics over
        time.
      </p>
      <div className="chart-grid">
        <div className="chart-card">
          <div className="row">
            <strong>Wages</strong>
            <Tooltip text="Average wage per labor unit." />
          </div>
          <Sparkline values={wages} label="Wages" />
        </div>
        <div className="chart-card">
          <div className="row">
            <strong>Prices ({sectorNames.sectorA})</strong>
            <Tooltip text="Price index in sector A." />
          </div>
          <Sparkline values={priceA} label="Prices sector A" />
        </div>
        <div className="chart-card">
          <div className="row">
            <strong>Prices ({sectorNames.sectorB})</strong>
            <Tooltip text="Price index in sector B." />
          </div>
          <Sparkline values={priceB} label="Prices sector B" />
        </div>
        <div className="chart-card">
          <div className="row">
            <strong>Output ({sectorNames.sectorA})</strong>
            <Tooltip text="Output in sector A." />
          </div>
          <Sparkline values={outputA} label="Output sector A" />
        </div>
        <div className="chart-card">
          <div className="row">
            <strong>Output ({sectorNames.sectorB})</strong>
            <Tooltip text="Output in sector B." />
          </div>
          <Sparkline values={outputB} label="Output sector B" />
        </div>
        <div className="chart-card">
          <div className="row">
            <strong>Innovation rate</strong>
            <Tooltip text="Rate of productivity growth." />
          </div>
          <Sparkline values={innovation} label="Innovation rate" />
        </div>
        <div className="chart-card">
          <div className="row">
            <strong>Diffusion rate</strong>
            <Tooltip text="Rate of knowledge diffusion." />
          </div>
          <Sparkline values={diffusion} label="Diffusion rate" />
        </div>
        <div className="chart-card">
          <div className="row">
            <strong>Inequality</strong>
            <Tooltip text="Index of distributional imbalance." />
          </div>
          <Sparkline values={inequality} label="Inequality" />
        </div>
        <div className="chart-card">
          <div className="row">
            <strong>Welfare</strong>
            <Tooltip text="Composite welfare index." />
          </div>
          <Sparkline values={welfare} label="Welfare" />
        </div>
        <div className="chart-card">
          <div className="row">
            <strong>Plural welfare</strong>
            <Tooltip text="Alternative welfare index with plural metrics." />
          </div>
          <Sparkline values={altWelfare} label="Plural welfare" />
        </div>
      </div>
    </section>
  );
};

export default ChartPanel;
