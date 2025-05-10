import React from 'react';
import Header from './components/Header';
import DataIngestionForm from './components/DataIngestionForm';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <DataIngestionForm />
      </main>
      <footer className="bg-white border-t border-slate-200 py-4">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Data Ingestion Tool
        </div>
      </footer>
    </div>
  );
}

export default App;