import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const GlassmorphicCard = ({ title, value, icon: Icon, trend, glowColor = '202, 59, 36', tooltip }) => {
  return (
    <div 
      className="glass-card"
      title={tooltip}
      style={{
        position: 'relative',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
        padding: '24px 24px 36px 24px',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: `0 4px 30px rgba(0, 0, 0, 0.2)`,
        cursor: 'pointer'
      }}
    >
      {/* Decorative Glow Dot */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: `rgba(${glowColor}, 0.08)`,
        filter: 'blur(20px)',
        pointerEvents: 'none'
      }} />

      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <span style={{ fontSize: '13px', color: '#888', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          {title}
        </span>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          backgroundColor: `rgba(${glowColor}, 0.1)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: `rgb(${glowColor})`,
          boxShadow: `inset 0 0 10px rgba(${glowColor}, 0.08)`,
          border: `1px solid rgba(${glowColor}, 0.15)`
        }}>
          {Icon && <Icon style={{ width: '20px', height: '20px' }} />}
        </div>
      </div>

      {/* Value */}
      <div style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '12px', letterSpacing: '-0.5px' }}>
        {value}
      </div>

      {/* Trend Indicator */}
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            fontSize: '12px',
            fontWeight: '700',
            color: trend.positive ? '#10b981' : '#ef4444',
            backgroundColor: trend.positive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            padding: '2px 6px',
            borderRadius: '6px',
            border: trend.positive ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)'
          }}>
            {trend.positive ? (
              <ArrowUpRight style={{ width: '14px', height: '14px' }} />
            ) : (
              <ArrowDownRight style={{ width: '14px', height: '14px' }} />
            )}
            <span>{trend.value}</span>
          </div>
          <span style={{ fontSize: '11px', color: '#555', fontWeight: '500' }}>
            {trend.label}
          </span>
        </div>
      )}

      {/* Hover Helper Text Tooltip */}
      {tooltip && (
        <div className="card-tooltip" style={{
          position: 'absolute',
          bottom: '8px',
          left: '24px',
          right: '24px',
          backgroundColor: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#aaa',
          fontSize: '10px',
          fontWeight: '600',
          padding: '4px 8px',
          borderRadius: '4px',
          opacity: 0,
          pointerEvents: 'none',
          transition: 'opacity 0.2s ease',
          zIndex: 10,
          textAlign: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
        }}>
          {tooltip}
        </div>
      )}

      {/* Global CSS inject for micro-animations */}
      <style dangerouslySetInnerHTML={{__html: `
        .glass-card:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.12) !important;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4) !important;
          background-color: rgba(255, 255, 255, 0.035) !important;
        }
        .glass-card:hover .card-tooltip {
          opacity: 1 !important;
        }
      `}} />
    </div>
  );
};

export default GlassmorphicCard;
