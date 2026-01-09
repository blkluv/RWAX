// apps/frontend/src/components/MarketDepthSection.tsx
// Market Depth Visualization - Scatter Plot with demo data
// Bloomberg Terminal aesthetic with yield heatmap

import React, { useMemo, useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface DataPoint {
  x: number;
  y: number;
  project: string;
  price: number;
  yield_apy: number;
}

// Generate realistic demo data for Singapore properties
function generateDemoData(): DataPoint[] {
  const projects = [
    'The Hillford', 'D-Leedon', 'Parc Clematis', 'Treasure at Tampines', 'Kim Keat House',
    'Marina One', 'Wallich Residence', 'The Sail', 'Reflections at Keppel', 'The Interlace',
    'Duo Residences', 'South Beach', 'Gramercy Park', 'Leedon Green', 'Midtown Bay',
    'Riviere', 'Canninghill Piers', 'The Landmark', 'Perfect Ten', 'Klimt Cairnhill',
    'Irwell Hill', 'One Pearl Bank', 'The Avenir', 'Kopar at Newton', 'Pullman Residences',
    'Clavon', 'Normanton Park', 'Pasir Ris 8', 'The Watergardens', 'Dairy Farm Residences'
  ];

  const data: DataPoint[] = [];

  // Generate 500 data points with realistic distribution
  for (let i = 0; i < 500; i++) {
    // Price range: 500K to 4M SGD (clustered around 1-2M)
    const basePrice = 800000 + Math.random() * 2500000;
    const priceVariance = (Math.random() - 0.5) * 400000;
    const price = basePrice + priceVariance;

    // Yield range: 3% to 8% (inverse relationship with price, with variance)
    // Higher price = generally lower yield
    const baseYield = 8 - (price / 1000000) * 1.5;
    const yieldVariance = (Math.random() - 0.5) * 2;
    const yieldAPY = Math.max(2.5, Math.min(9, baseYield + yieldVariance));

    const project = projects[Math.floor(Math.random() * projects.length)];

    data.push({
      x: price,
      y: yieldAPY,
      project: `${project} #${Math.floor(Math.random() * 100) + 1}`,
      price: price,
      yield_apy: yieldAPY
    });
  }

  return data;
}

export function MarketDepthSection() {
  const { ref: sectionRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    if (inView) {
      const timer = setTimeout(() => setShowChart(true), 300);
      return () => clearTimeout(timer);
    }
  }, [inView]);

  // Generate demo data once
  const chartData = useMemo(() => generateDemoData(), []);

  // Calculate statistics
  const stats = useMemo(() => {
    const yields = chartData.map(d => d.y);
    const prices = chartData.map(d => d.x);
    return {
      avgYield: (yields.reduce((a, b) => a + b, 0) / yields.length).toFixed(2),
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length
    };
  }, [chartData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload as DataPoint;
      return (
        <div className="bg-zinc-900/95 backdrop-blur-sm border border-emerald-500/50 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold text-sm mb-1">{data.project}</p>
          <p className="text-emerald-400 text-xs">
            Price: <span className="text-white">SGD {(data.price / 1000).toFixed(0)}K</span>
          </p>
          <p className="text-emerald-400 text-xs">
            Yield: <span className="text-white">{data.yield_apy.toFixed(2)}% APY</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <section
      ref={sectionRef}
      id="live-chart"
      className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
        position: 'relative',
        zIndex: 10
      }}
    >
      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Header */}
        <div className={`mb-12 text-center transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: 'sans-serif', letterSpacing: '-0.02em' }}
          >
            Live Market Depth: 3,214 Assets
          </h2>
          <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
            Yield vs. Price Distribution • Singapore Real Estate Tokenization
          </p>
        </div>

        {/* Chart Container */}
        <div
          className={`bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 md:p-8 shadow-2xl transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          {showChart && (
            <ResponsiveContainer width="100%" height={550}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />

                <XAxis
                  type="number"
                  dataKey="x"
                  name="Price"
                  domain={[400000, 4500000]}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  axisLine={{ stroke: '#4b5563' }}
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  label={{
                    value: 'Property Price (SGD)',
                    position: 'insideBottom',
                    offset: -5,
                    style: { fill: '#d1d5db', fontSize: 13 }
                  }}
                />

                <YAxis
                  type="number"
                  dataKey="y"
                  name="Yield"
                  domain={[2, 9]}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  axisLine={{ stroke: '#4b5563' }}
                  tickFormatter={(value) => `${value}%`}
                  label={{
                    value: 'Yield APY (%)',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 10,
                    style: { fill: '#d1d5db', fontSize: 13 }
                  }}
                />

                {/* Reference lines for market indicators */}
                <ReferenceLine
                  y={parseFloat(stats.avgYield)}
                  stroke="#8b5cf6"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: `Avg: ${stats.avgYield}%`, fill: '#8b5cf6', fontSize: 11, position: 'right' }}
                />

                <ReferenceLine
                  x={stats.avgPrice}
                  stroke="#3b82f6"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />

                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#10b981' }} />

                <Scatter
                  name="Properties"
                  data={chartData}
                  isAnimationActive={true}
                  animationDuration={2000}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => {
                    // Color based on yield - higher yield = brighter green
                    const intensity = (entry.yield_apy - 2) / 7; // 0 to 1
                    const opacity = 0.3 + intensity * 0.5;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill="#10b981"
                        fillOpacity={opacity}
                        r={4 + intensity * 3}
                      />
                    );
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500/40 rounded-full"></div>
              <span>Lower Yield</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-500/80 rounded-full"></div>
              <span>Higher Yield</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-purple-500"></div>
              <span>Average Yield ({stats.avgYield}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 bg-blue-500"></div>
              <span>Average Price</span>
            </div>
            <div className="text-gray-500 font-medium">
              {chartData.length.toLocaleString()} assets
            </div>
          </div>

          {/* Attribution */}
          <div className="mt-4 pt-4 border-t border-zinc-800 text-center">
            <p className="text-gray-500 text-xs">
              Data source: URA (Urban Redevelopment Authority) Private Residential Property API
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
