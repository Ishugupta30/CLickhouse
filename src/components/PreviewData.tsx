import React from 'react';

interface Column {
  name: string;
  type?: string;
  selected: boolean;
}

interface PreviewDataProps {
  data: any[];
  columns: Column[];
}

const PreviewData: React.FC<PreviewDataProps> = ({ data, columns }) => {
  if (data.length === 0) {
    return <p className="text-slate-500">No data to preview.</p>;
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.name} 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  {column.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                {columns.map((column) => (
                  <td key={`${rowIndex}-${column.name}`} className="px-6 py-2 whitespace-nowrap text-sm text-slate-700">
                    {row[column.name] !== undefined ? String(row[column.name]) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-50 p-3 border-t border-slate-200 text-sm text-slate-500">
        Showing {Math.min(data.length, 100)} of {data.length} rows
      </div>
    </div>
  );
};

export default PreviewData;