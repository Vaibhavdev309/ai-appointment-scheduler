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
    setIsModalOpen(false);

    const formData = new FormData();
    let headers = {};

    if (imageFile) {
      formData.append('image', imageFile);
    } else if (textInput.trim()) {
      headers['Content-Type'] = 'application/json';
    } else {
      setError('Please provide either text input or an image file.');
      setLoading(false);
      return;
    }

    try {
      const fetchOptions = {
        method: 'POST',
        headers,
      };

      if (imageFile) {
        fetchOptions.body = formData;
      } else {
        fetchOptions.body = JSON.stringify({ input: textInput.trim() });
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
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-100 flex flex-col items-center p-6">
      <h1 className="text-5xl font-extrabold text-indigo-700 mb-10 drop-shadow-md">
        AI Appointment Scheduler Tester
      </h1>

      <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl w-full space-y-8">
        {/* Input Section */}
        <section>
          <h2 className="text-3xl font-semibold text-gray-800 mb-4 border-b border-indigo-300 pb-2">
            Input
          </h2>

          <label htmlFor="textInput" className="block text-lg font-medium text-gray-700 mb-1">
            Text Input (e.g., "Book dentist next Friday at 3pm")
          </label>
          <input
            id="textInput"
            type="text"
            placeholder="Enter your appointment request here..."
            value={textInput}
            onChange={(e) => {
              setTextInput(e.target.value);
              setImageFile(null);
            }}
            disabled={loading}
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />

          <div className="flex items-center justify-center my-4 text-gray-500 font-semibold">OR</div>

          <label htmlFor="imageUpload" className="block text-lg font-medium text-gray-700 mb-1">
            Upload Image (e.g., screenshot of appointment request)
          </label>
          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files.length > 0) {
                setImageFile(e.target.files[0]);
                setTextInput('');
              } else {
                setImageFile(null);
              }
            }}
            disabled={loading}
            className="w-full text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-lg file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 transition cursor-pointer"
          />
          {imageFile && (
            <p className="mt-2 text-sm text-indigo-600 font-medium select-text">
              Selected file: {imageFile.name}
            </p>
          )}
        </section>

        {/* Endpoint Buttons */}
        <section>
          <h2 className="text-3xl font-semibold text-gray-800 mb-4 border-b border-indigo-300 pb-2">
            Choose Endpoint to Test
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {endpoints.map(({ name, path, title }) => (
              <button
                key={path}
                onClick={() => handleApiCall(path, title)}
                disabled={loading || (!textInput.trim() && !imageFile)}
                className={`py-3 px-6 rounded-lg font-semibold shadow-md transition
                  ${loading
                    ? 'bg-indigo-300 cursor-not-allowed text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                  }`}
                aria-label={`Call ${name} endpoint`}
              >
                {loading && modalTitle === title ? (
                  <Loader />
                ) : (
                  name
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Error Message (outside modal) */}
        {error && !isModalOpen && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
      </div>

      {/* Modal for JSON Output */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        ) : (
          <pre className="bg-gray-100 p-6 rounded-md text-sm max-h-[60vh] overflow-auto whitespace-pre-wrap break-words font-mono">
            {JSON.stringify(response, null, 2)}
          </pre>
        )}
      </Modal>
    </div>
  );
}

// Loader spinner component
const Loader = () => (
  <svg
    className="animate-spin h-6 w-6 mx-auto text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-label="Loading"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    ></path>
  </svg>
);

export default App;