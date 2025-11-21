import React from 'react';
import { motion } from 'framer-motion';
import './ChartComponent.css';

/**
 * ChartComponent - Simple chart visualization component
 * Supports line charts and bar charts
 */
const ChartComponent = ({ 
  data = [], 
  type = 'line', 
  height = 200,
  showGrid = true,
  showLabels = true,
  color = '#667eea',
  label = ''
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-component chart-empty" style={{ height }}>
        <p>No data available</p>
      </div>
    );
  }

  // Calculate dimensions
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;
  
  // Generate grid lines
  const gridLines = showGrid ? [0, 25, 50, 75, 100] : [];

  // Calculate points for line chart
  const getY = (value) => {
    const normalized = ((value - minValue) / range);
    return height - (normalized * (height - 40)) - 20; // Leave space for labels
  };

  const getX = (index) => {
    const chartWidth = 100; // percentage
    return (index / (data.length - 1)) * chartWidth;
  };

  const pathData = type === 'line' 
    ? data.map((point, index) => {
        const x = getX(index);
        const y = getY(point.value);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ')
    : null;

  // Create gradient for area fill
  const gradientId = `chart-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="chart-component" style={{ height }}>
      {label && <div className="chart-label">{label}</div>}
      
      <svg 
        viewBox={`0 0 100 ${height}`} 
        preserveAspectRatio="none"
        className="chart-svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {showGrid && gridLines.map((line, index) => (
          <line
            key={index}
            x1="0"
            y1={getY(minValue + (range * line / 100))}
            x2="100"
            y2={getY(minValue + (range * line / 100))}
            stroke="#e5e7eb"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
        ))}

        {type === 'line' && (
          <>
            {/* Area fill */}
            <path
              d={`${pathData} L ${getX(data.length - 1)} ${height} L 0 ${height} Z`}
              fill={`url(#${gradientId})`}
            />
            
            {/* Line */}
            <motion.path
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />

            {/* Data points */}
            {data.map((point, index) => (
              <motion.circle
                key={index}
                cx={getX(index)}
                cy={getY(point.value)}
                r="1.5"
                fill={color}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="chart-point"
              >
                <title>{`${point.label}: ${point.value}`}</title>
              </motion.circle>
            ))}
          </>
        )}

        {type === 'bar' && data.map((point, index) => {
          const barWidth = 80 / data.length;
          const x = (index / data.length) * 100 + 10;
          const barHeight = ((point.value - minValue) / range) * (height - 40);
          const y = height - barHeight - 20;

          return (
            <motion.rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={color}
              rx="1"
              initial={{ height: 0, y: height - 20 }}
              animate={{ height: barHeight, y }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              className="chart-bar"
            >
              <title>{`${point.label}: ${point.value}`}</title>
            </motion.rect>
          );
        })}
      </svg>

      {/* X-axis labels */}
      {showLabels && (
        <div className="chart-labels">
          {data.map((point, index) => {
            // Show every nth label based on data length
            const showEvery = Math.ceil(data.length / 6);
            if (index % showEvery !== 0 && index !== data.length - 1) return null;
            
            return (
              <span 
                key={index} 
                className="chart-label-x"
                style={{ left: `${getX(index)}%` }}
              >
                {point.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChartComponent;
