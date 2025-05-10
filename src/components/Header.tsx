import React from 'react';
import { Database } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-900 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center">
        <div className="flex items-center gap-2">
          <Database className="h-8 w-8 text-blue-400" />
          <div>
            <h1 className="text-xl font-bold">Data Ingestion Tool</h1>
            <p className="text-sm text-slate-400">ClickHouse & Flat File Integration</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;