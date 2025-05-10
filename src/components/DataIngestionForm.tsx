import React, { useState, useEffect } from 'react';
import SourceSelector from './SourceSelector';
import ConnectionForm from './ConnectionForm';
import ColumnSelector from './ColumnSelector';
import PreviewData from './PreviewData';
import IngestionStatus from './IngestionStatus';
import { AlertTriangle, ArrowDownUp, Check, Database, FileText } from 'lucide-react';

export type SourceType = 'clickhouse' | 'flatfile';
export type TargetType = 'clickhouse' | 'flatfile';
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';
export type IngestionProcessStatus = 'idle' | 'fetching-schema' | 'schema-loaded' | 'previewing' | 'ingesting' | 'completed' | 'error';

interface Column {
  name: string;
  type?: string;
  selected: boolean;
}

export interface ConnectionConfig {
  // ClickHouse specific
  endpoint?: string;
  keyId?: string;
  keySecret?: string;
  // Flat file specific
  fileName?: string;
  filePath?: string;
  delimiter?: string;
  file?: File;
}

const DataIngestionForm: React.FC = () => {
  const [source, setSource] = useState<SourceType>('clickhouse');
  const [target, setTarget] = useState<TargetType>('flatfile');
  const [sourceConfig, setSourceConfig] = useState<ConnectionConfig>({});
  const [targetConfig, setTargetConfig] = useState<ConnectionConfig>({});
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [processStatus, setProcessStatus] = useState<IngestionProcessStatus>('idle');
  const [columns, setColumns] = useState<Column[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [recordsProcessed, setRecordsProcessed] = useState<number>(0);

  // Reset target when source changes to prevent same source/target
  useEffect(() => {
    if (source === 'clickhouse') {
      setTarget('flatfile');
    } else if (source === 'flatfile') {
      setTarget('clickhouse');
    }
  }, [source]);

  // Handle source and target swap
  const handleSwapSourceTarget = () => {
    setSource(target);
    setTarget(source);
    setSourceConfig(targetConfig);
    setTargetConfig(sourceConfig);
    resetState();
  };

  const resetState = () => {
    setConnectionStatus('idle');
    setProcessStatus('idle');
    setColumns([]);
    setTables([]);
    setSelectedTable('');
    setPreviewData([]);
    setErrorMessage('');
    setRecordsProcessed(0);
  };

  const handleSourceConfigChange = (config: ConnectionConfig) => {
    setSourceConfig(config);
  };

  const handleTargetConfigChange = (config: ConnectionConfig) => {
    setTargetConfig(config);
  };

  const handleConnect = async () => {
    setConnectionStatus('connecting');
    setProcessStatus('idle');
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source,
          config: sourceConfig,
        }),
      });
      
      const data = await response.json().catch(() => ({
        success: false,
        message: 'Invalid server response'
      }));

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to connect to source');
      }
      
      setConnectionStatus('connected');
      
      if (source === 'clickhouse') {
        setTables(data.tables || []);
      }
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown connection error');
    }
  };

  const handleTableSelect = async (table: string) => {
    setSelectedTable(table);
    setProcessStatus('fetching-schema');
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source,
          config: sourceConfig,
          table,
        }),
      });
      
      const data = await response.json().catch(() => ({
        success: false,
        message: 'Invalid server response'
      }));

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch schema');
      }
      
      // Convert schema to columns
      const fetchedColumns = data.columns.map((col: any) => ({
        name: col.name,
        type: col.type,
        selected: true, // Default all columns as selected
      }));
      
      setColumns(fetchedColumns);
      setProcessStatus('schema-loaded');
    } catch (error) {
      console.error('Schema fetch error:', error);
      setProcessStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown schema error');
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file) {
      setErrorMessage('No file selected');
      return;
    }

    setSourceConfig({ ...sourceConfig, file });
    setProcessStatus('fetching-schema');
    setErrorMessage('');
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', file);
    if (sourceConfig.delimiter) {
      formData.append('delimiter', sourceConfig.delimiter);
    }
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to upload file');
      }
      
      // Convert schema to columns
      const fileColumns = (data.columns || []).map((col: string) => ({
        name: col,
        selected: true, // Default all columns as selected
      }));
      
      setSourceConfig(prev => ({ ...prev, filePath: data.filePath }));
      setColumns(fileColumns);
      setConnectionStatus('connected');
      setProcessStatus('schema-loaded');
    } catch (error) {
      console.error('File upload error:', error);
      setProcessStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown file error');
    }
  };

  const handleColumnSelect = (columnName: string, selected: boolean) => {
    setColumns(
      columns.map((col) => 
        col.name === columnName ? { ...col, selected } : col
      )
    );
  };

  const handleSelectAllColumns = (selected: boolean) => {
    setColumns(columns.map((col) => ({ ...col, selected })));
  };

  const handlePreviewData = async () => {
    setProcessStatus('previewing');
    setErrorMessage('');
    
    // Get selected column names
    const selectedColumns = columns
      .filter((col) => col.selected)
      .map((col) => col.name);
    
    if (selectedColumns.length === 0) {
      setProcessStatus('error');
      setErrorMessage('Please select at least one column to preview');
      return;
    }
    
    try {
      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source,
          config: sourceConfig,
          table: selectedTable,
          columns: selectedColumns,
        }),
      });
      
      const data = await response.json().catch(() => ({
        success: false,
        message: 'Invalid server response'
      }));

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to preview data');
      }
      
      setPreviewData(data.rows || []);
      setProcessStatus('schema-loaded'); // Return to schema loaded state
    } catch (error) {
      console.error('Preview error:', error);
      setProcessStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown preview error');
    }
  };

  const handleStartIngestion = async () => {
    setProcessStatus('ingesting');
    setErrorMessage('');
    setRecordsProcessed(0);
    
    // Get selected column names
    const selectedColumns = columns
      .filter((col) => col.selected)
      .map((col) => col.name);
    
    if (selectedColumns.length === 0) {
      setProcessStatus('error');
      setErrorMessage('Please select at least one column for ingestion');
      return;
    }
    
    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source,
          target,
          sourceConfig,
          targetConfig,
          table: selectedTable,
          columns: selectedColumns,
        }),
      });
      
      const data = await response.json().catch(() => ({
        success: false,
        message: 'Invalid server response'
      }));

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Ingestion failed');
      }
      
      setRecordsProcessed(data.recordsProcessed || 0);
      setProcessStatus('completed');
    } catch (error) {
      console.error('Ingestion error:', error);
      setProcessStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown ingestion error');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto transition-all duration-300">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Data Ingestion Configuration</h2>
      
      {/* Source & Target Selection with Swap Button */}
      <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
        <div className="flex-1">
          <SourceSelector 
            label="Source"
            value={source}
            onChange={setSource}
            icon={source === 'clickhouse' ? <Database className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          />
        </div>
        
        <button 
          onClick={handleSwapSourceTarget}
          className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
          title="Swap source and target"
        >
          <ArrowDownUp className="h-5 w-5 text-slate-600" />
        </button>
        
        <div className="flex-1">
          <SourceSelector 
            label="Target"
            value={target}
            onChange={setTarget}
            disabled={true}
            icon={target === 'clickhouse' ? <Database className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          />
        </div>
      </div>
      
      {/* Connection Forms */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-3">
          {source === 'clickhouse' ? 'ClickHouse Connection' : 'Flat File Configuration'}
        </h3>
        
        <ConnectionForm 
          sourceType={source}
          config={sourceConfig}
          onChange={handleSourceConfigChange}
          onConnect={handleConnect}
          onFileSelect={handleFileSelect}
          connectionStatus={connectionStatus}
          tables={tables}
          selectedTable={selectedTable}
          onTableSelect={handleTableSelect}
        />
      </div>
      
      {/* Target Configuration (simplified) */}
      {connectionStatus === 'connected' && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">
            {target === 'clickhouse' ? 'ClickHouse Target Configuration' : 'Flat File Target'}
          </h3>
          
          <ConnectionForm 
            sourceType={target}
            config={targetConfig}
            onChange={handleTargetConfigChange}
            onConnect={() => {}}
            isTarget={true}
          />
        </div>
      )}
      
      {/* Column Selector */}
      {processStatus === 'schema-loaded' && columns.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Select Columns for Ingestion</h3>
          
          <ColumnSelector 
            columns={columns}
            onColumnSelect={handleColumnSelect}
            onSelectAll={handleSelectAllColumns}
          />
          
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handlePreviewData}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
            >
              Preview Data
            </button>
            
            <button
              onClick={handleStartIngestion}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Start Ingestion
            </button>
          </div>
        </div>
      )}
      
      {/* Preview Data Section */}
      {previewData.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Data Preview</h3>
          
          <PreviewData 
            data={previewData}
            columns={columns.filter(col => col.selected)}
          />
        </div>
      )}
      
      {/* Status Display */}
      <IngestionStatus 
        status={processStatus}
        errorMessage={errorMessage}
        recordsProcessed={recordsProcessed}
      />
      
      {/* Error Messages */}
      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <p>{errorMessage}</p>
        </div>
      )}
      
      {/* Success Message */}
      {processStatus === 'completed' && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-600">
          <Check className="h-5 w-5" />
          <p>Data ingestion completed successfully! {recordsProcessed} records processed.</p>
        </div>
      )}
    </div>
  );
};

export default DataIngestionForm;