import React, { useState } from 'react';
import TextExtractionForm from './components/TextExtractionForm';
import EntityExtractionForm from './components/EntityExtractionForm';
import NormalizationForm from './components/NormalizationForm';
import FinalJsonForm from './components/FinalJsonForm';

function App() {
  const [activeTab, setActiveTab] = useState('final-json'); // Default to the most comprehensive test

  const renderContent = () => {
    switch (activeTab) {
      case 'text-extraction':
        return <TextExtractionForm />;
      case 'entity-extraction':
        return <EntityExtractionForm />;
      case 'normalization':
        return <NormalizationForm />;
      case 'final-json':
        return <FinalJsonForm />;
      default:
        return <FinalJsonForm />;
    }
  };

  return (
    <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg max-w-4xl">
      <h1 className="text-4xl font-bold text-center text-blue-700 mb-8">
        AI Appointment Scheduler Tester
      </h1>

      <div className="flex justify-center mb-8 border-b border-gray-200">
        <button
          className={`py-3 px-6 text-lg font-medium ${activeTab === 'text-extraction'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('text-extraction')}
        >
          Step 1: Text Extraction
        </button>
        <button
          className={`py-3 px-6 text-lg font-medium ${activeTab === 'entity-extraction'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('entity-extraction')}
        >
          Step 2: Entity Extraction
        </button>
        <button
          className={`py-3 px-6 text-lg font-medium ${activeTab === 'normalization'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('normalization')}
        >
          Step 3: Normalization
        </button>
        <button
          className={`py-3 px-6 text-lg font-medium ${activeTab === 'final-json'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('final-json')}
        >
          Step 4: Final JSON
        </button>
      </div>

      <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;