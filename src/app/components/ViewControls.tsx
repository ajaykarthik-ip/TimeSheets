import React from 'react';

type ViewMode = 'week' | 'month';

interface ViewControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function ViewControls({ viewMode, onViewModeChange }: ViewControlsProps) {
  return (
    <div className="view-controls">
      <button 
        className={viewMode === 'week' ? 'active' : ''}
        onClick={() => onViewModeChange('week')}
      >
        Week
      </button>
      <button 
        className={viewMode === 'month' ? 'active' : ''}
        onClick={() => onViewModeChange('month')}
      >
        Month
      </button>
    </div>
  );
}