import React, { ChangeEvent } from 'react';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { ConnectionConfig, ConnectionStatus, SourceType } from './DataIngestionForm';

interface ConnectionFormProps {
  sourceType: SourceType;
  config: ConnectionConfig;
  onChange: (config: ConnectionConfig) => void;
  onConnect: () => void;
  onFileSelect?: (file: File) => void;
  connectionStatus?: ConnectionStatus;
  tables?: string[];
  selectedTable?: string;
  onTableSelect?: (table: string) => void;
  isTarget?: boolean;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({
  sourceType,
  config,
  onChange,
  onConnect,
  onFileSelect,
  connectionStatus = 'idle',
  tables = [],
  selectedTable = '',
  onTableSelect,
  isTarget = false,
}) => {
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({ ...config, [name]: value });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onFileSelect) {
      onFileSelect(e.target.files[0]);
    }
  };

  if (sourceType === 'clickhouse') {
    return (
      <div className="space-y-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
        <div>
          <label htmlFor="endpoint" className="block text-sm font-medium text-slate-700 mb-1">
            API Endpoint
          </label>
          <input
            type="text"
            id="endpoint"
            name="endpoint"
            value={config.endpoint || ''}
            onChange={handleInputChange}
            placeholder="e.g., https://console-api.clickhouse.cloud/.api/query-endpoints/your-endpoint"
            className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={isTarget || connectionStatus === 'connected'}
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="keyId" className="block text-sm font-medium text-slate-700 mb-1">
              Key ID
            </label>
            <input
              type="text"
              id="keyId"
              name="keyId"
              value={config.keyId || ''}
              onChange={handleInputChange}
              placeholder="Enter your Key ID"
              className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isTarget || connectionStatus === 'connected'}
              required
            />
          </div>
          
          <div>
            <label htmlFor="keySecret" className="block text-sm font-medium text-slate-700 mb-1">
              Key Secret
            </label>
            <input
              type="password"
              id="keySecret"
              name="keySecret"
              value={config.keySecret || ''}
              onChange={handleInputChange}
              placeholder="Enter your Key Secret"
              className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isTarget || connectionStatus === 'connected'}
              required
            />
          </div>
        </div>
        
        {!isTarget && (
          <div className="flex justify-end">
            <button
              onClick={onConnect}
              disabled={connectionStatus === 'connecting' || connectionStatus === 'connected'}
              className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                connectionStatus === 'connected'
                  ? 'bg-green-100 text-green-700'
                  : connectionStatus === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } transition-colors`}
            >
              {connectionStatus === 'connecting' && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {connectionStatus === 'connected' && <Check className="h-4 w-4" />}
              {connectionStatus === 'error' && <AlertTriangle className="h-4 w-4" />}
              {connectionStatus === 'connected'
                ? 'Connected'
                : connectionStatus === 'connecting'
                ? 'Connecting...'
                : connectionStatus === 'error'
                ? 'Connection Failed'
                : 'Connect'}
            </button>
          </div>
        )}
        
        {/* Table Selector */}
        {!isTarget && connectionStatus === 'connected' && tables.length > 0 && (
          <div className="mt-4">
            <label htmlFor="table" className="block text-sm font-medium text-slate-700 mb-1">
              Select Table
            </label>
            <select
              id="table"
              value={selectedTable}
              onChange={(e) => onTableSelect && onTableSelect(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select a table --</option>
              {tables.map((table) => (
                <option key={table} value={table}>
                  {table}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }
  
  // Flat File Form
  return (
    <div className="space-y-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
      {!isTarget ? (
        <>
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-slate-700 mb-1">
              Select File
            </label>
            <input
              type="file"
              id="file"
              onChange={handleFileChange}
              className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              accept=".csv,.txt,.tsv"
              disabled={connectionStatus === 'connected'}
            />
            <p className="mt-1 text-sm text-slate-500">
              Supported formats: CSV, TSV, TXT
            </p>
          </div>
          
          <div>
            <label htmlFor="delimiter" className="block text-sm font-medium text-slate-700 mb-1">
              Delimiter
            </label>
            <select
              id="delimiter"
              name="delimiter"
              value={config.delimiter || ','}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={connectionStatus === 'connected'}
            >
              <option value=",">Comma (,)</option>
              <option value="\t">Tab (\t)</option>
              <option value=";">Semicolon (;)</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>
        </>
      ) : (
        // Target Flat File Configuration
        <>
          <div>
            <label htmlFor="fileName" className="block text-sm font-medium text-slate-700 mb-1">
              Output File Name
            </label>
            <input
              type="text"
              id="fileName"
              name="fileName"
              value={config.fileName || ''}
              onChange={handleInputChange}
              placeholder="e.g., output.csv"
              className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="delimiter" className="block text-sm font-medium text-slate-700 mb-1">
              Delimiter
            </label>
            <select
              id="delimiter"
              name="delimiter"
              value={config.delimiter || ','}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value=",">Comma (,)</option>
              <option value="\t">Tab (\t)</option>
              <option value=";">Semicolon (;)</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
};

export default ConnectionForm;