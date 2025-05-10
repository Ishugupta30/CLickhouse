import React, { ReactNode } from 'react';
import { SourceType } from './DataIngestionForm';

interface SourceSelectorProps {
  label: string;
  value: SourceType;
  onChange: (value: SourceType) => void;
  disabled?: boolean;
  icon?: ReactNode;
}

const SourceSelector: React.FC<SourceSelectorProps> = ({ 
  label, 
  value, 
  onChange, 
  disabled = false,
  icon
}) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as SourceType)}
          disabled={disabled}
          className="block w-full pl-10 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm disabled:bg-slate-100 disabled:text-slate-500"
        >
          <option value="clickhouse">ClickHouse</option>
          <option value="flatfile">Flat File</option>
        </select>
      </div>
    </div>
  );
};

export default SourceSelector;