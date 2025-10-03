import React, { useState } from 'react';
import Modal from './components/Modal';

function App() {
  const [textInput, setTextInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  const endpoints = [
    { name: 'Text Extraction', path: '/api/appointments/extract-text', title: 'Step 1: Text Extraction Result' },
    { name: 'Entity Extraction', path: '/api/appointments/extract-entities', title: 'Step 2: Entity Extraction Result' },
    { name: 'Normalization', path: '/api/appointments/normalize', title: 'Step 3: Normalization Result' },
    { name: 'Final JSON', path: '/api/appointments/final-json', title: 'Step 4: Final Appointment JSON' },
  ];

  const handleApiCall = async (endpointPath, endpointTitle) => {
    setLoading(true);
    setResponse(null);
    setError(null);
    setIsModalOpen(false); // Close any open modal

    const formData = new FormData();
    let headers = {};

    if (imageFile) {
      formData.append('image', imageFile);
      // For multipart/form-data, browser sets Content-Type automatically
    } else if (textInput) {
      // If sending JSON, we need to specify Content-Type
      headers['Content-Type'] = 'application/json';
    } else {
      setError('Please provide either text input or an image file.');
      setLoading(false);
      return;
    }

    try {
      const fetchOptions = {
        method: 'POST',
        headers: headers,
      };

      if (imageFile) {
        fetchOptions.body = formData; // FormData handles its own Content-Type
      } else {
        fetchOptions.body = JSON.stringify({ input: textInput });
      }

      const res = await fetch(`${API_BASE_URL}${endpointPath}`, fetchOptions);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `API call failed with status ${res.status}`);
      }
      setResponse(data);
      setModalTitle(endpointTitle);
      setIsModalOpen(true);
    } catch (err) {
      setError(err.message);
      setModalTitle('Error');
      setIsModalOpen(true); // Show error in modal too
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg max-w-4xl">
      <h1 className="text-4xl font-bold text-center text-blue-700 mb-8">
        AI Appointment Scheduler Tester
      </h1>

      <div className="p-6 border border-gray-200 rounded-md bg-gray-50 space-y-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">Input</h2>
        <div>
          <label htmlFor="textInput" className="block text-sm font-medium text-gray-700">
            Text Input (e.g., "Book dentist next Friday at 3pm")
          </label>
          <input
            type="text"
            id="textInput"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={textInput}
            onChange={(e) => {
              setTextInput(e.target.value);
              setImageFile(null); // Clear image if text is entered
            }}
            placeholder="Enter your appointment request here..."
          />
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-gray-500">OR</span>
          <div className="flex-grow">
            <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-700">
              Upload Image (e.g., a screenshot of an appointment request)
            </label>
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={(e) => {
                setImageFile(e.target.files[0]);
                setTextInput(''); // Clear text if image is uploaded
              }}
            />
            {imageFile && <p className="text-xs text-gray-500 mt-1">Selected: {imageFile.name}</p>}
          </div>
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Choose Endpoint to Test</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {endpoints.map((ep) => (
            <button
              key={ep.path}
              onClick={() => handleApiCall(ep.path, ep.title)}
              className="py-3 px-6 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || (!textInput && !imageFile)}
            >
              {loading && ep.path === endpoints.find(e => e.title === modalTitle)?.path ? 'Loading...' : ep.name}
            </button>
          ))}
        </div>
      </div>

      {error && !isModalOpen && ( // Show error outside modal if modal isn't open yet
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        ) : (
          <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
            {JSON.stringify(response, null, 2)}
          </pre>
        )}
      </Modal>
    </div>
  );
}

export default App;