'use client';
import React from 'react';
import { Database, Activity, Network, Layout, GitCompare, GitBranch } from 'lucide-react';

const diagramTypes = [
  { id: 'er', label: 'ER Diagram', icon: Database, desc: 'Entity-Relationships' },
  { id: 'sequence', label: 'Sequence', icon: Activity, desc: 'System Behavior' },
  { id: 'deployment', label: 'Deployment', icon: Network, desc: 'Infrastructure' },
  { id: 'class', label: 'Class', icon: Layout, desc: 'Object Structure' },
  { id: 'state', label: 'State', icon: GitCompare, desc: 'State Transitions' },
  { id: 'architecture', label: 'Architecture', icon: GitBranch, desc: 'High-level View' },
];

export default function DiagramTypeSelector({ selectedType, onSelectType }) {
  return (
    <div className="options-grid">
      {diagramTypes.map((type) => {
        const Icon = type.icon;
        const isSelected = selectedType === type.id;

        return (
          <div
            key={type.id}
            className={`diagram-option ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelectType(type.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectType(type.id);
              }
            }}
          >
            <Icon
              size={24}
              style={{
                margin: '0 auto 0.5rem',
                color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)',
                transition: 'color 0.3s ease'
              }}
            />
            <h4 style={{ margin: 0, fontSize: '1rem', color: isSelected ? 'var(--text-main)' : 'var(--text-muted)' }}>
              {type.label}
            </h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', opacity: isSelected ? 0.9 : 0.6 }}>
              {type.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
}
