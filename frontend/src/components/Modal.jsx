import React from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex justify-between items-center border-b border-gray-300 pb-3 mb-4">
                    <h2 id="modal-title" className="text-2xl font-semibold text-gray-900">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        aria-label="Close modal"
                        className="text-gray-600 hover:text-gray-900 text-3xl font-bold leading-none focus:outline-none"
                    >
                        &times;
                    </button>
                </header>
                <main className="text-gray-800">{children}</main>
                <footer className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default Modal;