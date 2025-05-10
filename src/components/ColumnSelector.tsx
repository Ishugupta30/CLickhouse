import React from 'react';

interface Column {
  name: string;
  type?: string;
  selected: boolean;
}

interface ColumnSelectorProps {
  columns: Column[];
  onColumnSelect: (columnName: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({ 
  columns, 
  onColumnSelect,
  onSelectAll
}) => {
  const allSelected = columns.every((column) => column.selected);
  const someSelected = columns.some((column) => column.selected);
  
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-100 p-3 border-b border-slate-200 flex items-center">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
          />
          <span className="ml-2 text-sm font-medium text-slate-700">
            {allSelected ? 'Deselect All' : someSelected ? 'Select All' : 'Select All'}
          </span>
        </label>
      </div>
      
      <div className="max-h-64 overflow-y-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Select
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Column Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Type
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {columns.map((column) => (
              <tr key={column.name} className="hover:bg-slate-50">
                <td className="px-6 py-2 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={column.selected}
                    onChange={(e) => onColumnSelect(column.name, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                </td>
                <td className="px-6 py-2 whitespace-nowrap">
                  <span className="text-sm text-slate-700">{column.name}</span>
                </td>
                <td className="px-6 py-2 whitespace-nowrap">
                  <span className="text-sm text-slate-500">{column.type || '-'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ColumnSelector;