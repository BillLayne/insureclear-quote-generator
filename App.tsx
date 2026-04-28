import React, { useState } from 'react';
import { Upload, FileText, Download, Wand2, AlertCircle, Home, Car, Shield, Star } from 'lucide-react';
import { InsuranceData, QuoteType } from './types';
import { parseInsuranceQuote } from './services/geminiService';
import { generateInsuranceHtml } from './utils/htmlGenerator';
import PreviewTemplate from './components/PreviewTemplate';
import { EditDataForm } from './components/EditDataForm';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [instructions, setInstructions] = useState('');
  const [homePhotoUrl, setHomePhotoUrl] = useState('');
  const [quoteType, setQuoteType] = useState<QuoteType>('home');
  const [isProcessing, setIsProcessing] = useState(false);
  const [data, setData] = useState<InsuranceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleProcess = async () => {
    if (!file) {
      setError('Please upload a PDF or Image of the quote first.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await parseInsuranceQuote(file, instructions, quoteType);
      
      // Inject the manually provided hero URL if applicable
      if (quoteType === 'home-hero' && homePhotoUrl) {
        result.homePhotoUrl = homePhotoUrl;
      }

      setData(result);
    } catch (err) {
      console.error(err);
      setError('Failed to process the document. Please ensure it is a valid quote and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!data) return;
    const html = generateInsuranceHtml(data);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Quote_Explanation_${data.customer.name.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setData(null);
    setFile(null);
    setInstructions('');
    // We optionally keep the photo URL as it might be reused, or clear it.
    // setHomePhotoUrl(''); 
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <FileText size={20} />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">InsureClear</span>
            </div>
            <div className="text-sm text-gray-500 hidden sm:block">AI-Powered Proposal Generator</div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
          
          {/* LEFT COLUMN: Controls or Edit Form */}
          <div className="lg:col-span-4 h-full">
            
            {!data ? (
              /* UPLOAD MODE */
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                
                {/* Type Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Quote Type
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                     {/* Row 1 */}
                    <button
                      onClick={() => setQuoteType('home')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                        quoteType === 'home'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <Home size={20} className="mb-1" />
                      <span className="text-xs font-semibold">Home (Standard)</span>
                    </button>
                    <button
                      onClick={() => setQuoteType('home-hero')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                        quoteType === 'home-hero'
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                         <Home size={20} className="mb-1" />
                         <Star size={14} className="mb-1 text-yellow-500 fill-yellow-500" />
                      </div>
                      <span className="text-xs font-semibold">Home + Hero</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Row 2 */}
                    <button
                      onClick={() => setQuoteType('auto')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                        quoteType === 'auto'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <Car size={20} className="mb-1" />
                      <span className="text-xs font-semibold">Auto</span>
                    </button>
                    <button
                      onClick={() => setQuoteType('other')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                        quoteType === 'other'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <Shield size={20} className="mb-1" />
                      <span className="text-xs font-semibold">Other</span>
                    </button>
                  </div>
                </div>

                {/* Hero Photo Input (Conditional) */}
                {quoteType === 'home-hero' && (
                  <div className="mb-6 bg-purple-50 p-3 rounded-lg border border-purple-100 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-xs font-bold text-purple-800 mb-2 uppercase tracking-wide">
                      Step 1: Customer Home Photo
                    </label>
                    <input
                      type="text"
                      value={homePhotoUrl}
                      onChange={(e) => setHomePhotoUrl(e.target.value)}
                      placeholder="Paste Imgur link here..."
                      className="w-full px-3 py-2 border border-purple-200 rounded-md text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 bg-white"
                    />
                    <p className="text-[10px] text-purple-600 mt-1">
                      Paste a direct image link (e.g. Imgur) to display the customer's home as the hero image.
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-100 my-6"></div>

                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Upload size={18} className="text-blue-600" />
                  Upload Quote
                </h2>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quote Document (PDF or Image)
                  </label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors bg-gray-50 text-center">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center">
                      {file ? (
                        <>
                          <FileText className="h-8 w-8 text-green-500 mb-2" />
                          <span className="text-sm font-medium text-gray-900 truncate max-w-xs">{file.name}</span>
                          <span className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">Click to upload or drag and drop</span>
                          <span className="text-xs text-gray-400 mt-1">PDF, PNG, JPG supported</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instructions & Descriptions
                  </label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="e.g., Emphasize specific coverages or add notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 text-sm"
                  />
                </div>

                <button
                  onClick={handleProcess}
                  disabled={isProcessing || !file}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white font-medium transition-all ${
                    isProcessing || !file
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Parsing {quoteType} quote...
                    </>
                  ) : (
                    <>
                      <Wand2 size={18} />
                      Generate Template
                    </>
                  )}
                </button>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    {error}
                  </div>
                )}
              </div>
            ) : (
              /* EDIT MODE */
              <EditDataForm 
                data={data} 
                onUpdate={setData} 
                onDownload={handleDownload}
                onBack={handleReset}
              />
            )}
          </div>

          {/* RIGHT COLUMN: Preview */}
          <div className="lg:col-span-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Live Preview</h2>
              {data && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  data.type === 'home-hero' 
                    ? 'text-purple-700 bg-purple-100' 
                    : 'text-green-700 bg-green-100'
                }`}>
                  {data.type === 'home-hero' ? 'HOME + HERO' : data.type.toUpperCase()} Template Active
                </span>
              )}
            </div>
            {data ? (
              <div className="flex-1 overflow-hidden shadow-lg rounded-lg border border-gray-200">
                 <PreviewTemplate data={data} />
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-xl h-full flex flex-col items-center justify-center text-gray-400 bg-white min-h-[500px]">
                <FileText size={48} className="mb-4 opacity-20" />
                <p>Upload a quote to generate your preview</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;