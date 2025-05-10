import React from 'react';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { IngestionProcessStatus } from './DataIngestionForm';

interface IngestionStatusProps {
  status: IngestionProcessStatus;
  errorMessage?: string;
  recordsProcessed?: number;
}

const IngestionStatus: React.FC<IngestionStatusProps> = ({
  status,
  errorMessage,
  recordsProcessed = 0,
}) => {
  if (status === 'idle') {
    return null;
  }

  const statusMessages: Record<IngestionProcessStatus, string> = {
    idle: '',
    'fetching-schema': 'Fetching schema...',
    'schema-loaded': 'Schema loaded',
    previewing: 'Generating data preview...',
    ingesting: 'Ingesting data...',
    completed: `Ingestion completed. ${recordsProcessed} records processed.`,
    error: errorMessage || 'An error occurred',
  };

  const statusColors: Record<IngestionProcessStatus, string> = {
    idle: '',
    'fetching-schema': 'bg-blue-50 text-blue-700 border-blue-200',
    'schema-loaded': 'bg-green-50 text-green-700 border-green-200',
    previewing: 'bg-blue-50 text-blue-700 border-blue-200',
    ingesting: 'bg-amber-50 text-amber-700 border-amber-200',
    completed: 'bg-green-50 text-green-700 border-green-200',
    error: 'bg-red-50 text-red-700 border-red-200',
  };

  const statusIcons = {
    'fetching-schema': <Loader2 className="h-5 w-5 animate-spin" />,
    'schema-loaded': <Check className="h-5 w-5" />,
    previewing: <Loader2 className="h-5 w-5 animate-spin" />,
    ingesting: <Loader2 className="h-5 w-5 animate-spin" />,
    completed: <Check className="h-5 w-5" />,
    error: <AlertTriangle className="h-5 w-5" />,
    idle: null,
  };

  // Skip rendering for schema-loaded state
  if (status === 'schema-loaded') {
    return null;
  }

  return (
    <div className={`mt-4 p-3 border rounded-md flex items-center gap-2 ${statusColors[status]}`}>
      {statusIcons[status]}
      <p>{statusMessages[status]}</p>
      
      {status === 'ingesting' && (
        <div className="w-full max-w-xs bg-white h-2 rounded-full overflow-hidden ml-2">
          <div className="h-full bg-amber-500 animate-pulse" style={{ width: '100%' }}></div>
        </div>
      )}
    </div>
  );
};

export default IngestionStatus;