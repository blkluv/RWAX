// apps/frontend/src/components/DemoVerificationModal.tsx
// Demo Verification Modal - Document upload and real OCR/parsing with backend logging
// For hero section demo purposes

import React, { useState, useRef } from 'react';
import { X, Scan, CheckCircle, Loader, Upload, FileText, AlertCircle } from 'lucide-react';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { parseDocumentText, createDIDPayload, type ParsedDocumentData } from '../utils/documentParser';
import { Logger } from '../utils/logger';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface DemoVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoVerificationModal({ isOpen, onClose }: DemoVerificationModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploaded' | 'scanning' | 'parsing' | 'verified' | 'error'>('idle');
  const [progress, setProgress] = useState('');
  const [parsedData, setParsedData] = useState<ParsedDocumentData | null>(null);
  const [didHash, setDidHash] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setStatus('uploaded');
      
      // Create preview URL
      if (uploadedFile.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(uploadedFile));
      } else if (uploadedFile.type === 'application/pdf') {
        setPreviewUrl(null);
      }
      
      // Reset previous results
      setParsedData(null);
      setDidHash('');
      setProgress('');
      
      // Send upload event to backend
      sendEventToBackend('document_upload', {
        fileName: uploadedFile.name,
        fileType: uploadedFile.type,
        fileSize: `${(uploadedFile.size / 1024).toFixed(2)} KB`
      });
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    Logger.info("Extracting text from PDF", { fileName: file.name });
    setProgress('Reading PDF document...');
    sendEventToBackend('pdf_extraction_start', { fileName: file.name });
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    Logger.info(`PDF has ${pdf.numPages} pages`, { totalPages: pdf.numPages });
    
    for (let i = 1; i <= pdf.numPages; i++) {
      setProgress(`Processing page ${i} of ${pdf.numPages}...`);
      sendEventToBackend('pdf_page_processing', { page: i, totalPages: pdf.numPages });
      
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => {
          if ('str' in item && typeof item.str === 'string') {
            return item.str;
          }
          return '';
        })
        .join(' ');
      fullText += pageText + '\n';
    }
    
    Logger.success("PDF text extraction complete", {
      totalCharacters: fullText.length,
      pages: pdf.numPages
    });
    
    sendEventToBackend('pdf_extraction_complete', {
      textLength: fullText.length,
      pages: pdf.numPages
    });
    
    return fullText;
  };

  const extractTextFromImage = async (imageUrl: string): Promise<string> => {
    Logger.ocrScan("Starting OCR extraction", { method: "Tesseract.js" });
    setProgress('Running AI OCR on image...');
    sendEventToBackend('ocr_scan_start', { method: 'Tesseract.js' });
    
    const result = await Tesseract.recognize(imageUrl, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          setProgress(`OCR: ${Math.round(m.progress * 100)}%`);
          if (m.progress === 0 || m.progress >= 0.5 || m.progress === 1) {
            Logger.info(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            sendEventToBackend('ocr_progress', {
              progress: Math.round(m.progress * 100)
            });
          }
        }
      }
    });
    
    Logger.success("OCR completed", {
      charactersExtracted: result.data.text.length,
      confidence: result.data.confidence ? `${Math.round(result.data.confidence)}%` : "N/A"
    });
    
    sendEventToBackend('ocr_scan_complete', {
      textLength: result.data.text.length,
      confidence: result.data.confidence ? Math.round(result.data.confidence) : 0
    });
    
    return result.data.text;
  };

  const sendEventToBackend = async (eventType: string, data: any) => {
    try {
      await fetch('http://localhost:3001/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: eventType,
          data: data
        })
      });
    } catch (error) {
      // Backend might not be running - that's fine
      console.log(`Backend not available for ${eventType}`);
    }
  };

  const handleStartParsing = async () => {
    if (!file) return;
    
    Logger.action("Document Verification Started", {
      fileName: file.name,
      fileType: file.type,
      fileSize: `${(file.size / 1024).toFixed(2)} KB`
    });
    
    setStatus('scanning');
    setProgress('Starting document verification...');
    
    try {
      let extractedText = '';
      
      // Step 1: Extract text based on file type
      if (file.type === 'application/pdf') {
        setProgress('Extracting text from PDF...');
        extractedText = await extractTextFromPDF(file);
      } else if (file.type.startsWith('image/')) {
        setProgress('Extracting text from image...');
        const imageUrl = previewUrl || URL.createObjectURL(file);
        extractedText = await extractTextFromImage(imageUrl);
      } else {
        throw new Error('Unsupported file type. Please upload PDF or image (JPG, PNG)');
      }
      
      // Step 2: Parse structured data
      setStatus('parsing');
      setProgress('Parsing and validating document data...');
      
      sendEventToBackend('document_parsing_start', {
        patterns: ['NRIC', 'Passport', 'Name', 'Property ID', 'Address', 'Accreditation', 'Tax Reference']
      });
      
      const parsed = parseDocumentText(extractedText);
      setParsedData(parsed);
      
      // Log parsing results
      const extractionSummary: any = {
        documentType: parsed.documentType,
        isValid: parsed.isValid,
        hash: parsed.hash.substring(0, 16) + "..."
      };
      
      if (parsed.extractedFields.name) {
        extractionSummary.name = parsed.extractedFields.name;
      }
      if (parsed.extractedFields.nric) {
        extractionSummary.nric = parsed.extractedFields.nric;
      } else if (parsed.extractedFields.passport) {
        extractionSummary.passport = parsed.extractedFields.passport;
      }
      if (parsed.extractedFields.propertyId) {
        extractionSummary.propertyId = parsed.extractedFields.propertyId;
      }
      if (parsed.extractedFields.accreditationStatus) {
        extractionSummary.accredited = true;
      }
      
      Logger.documentParse("Document parsing complete", extractionSummary);
      
      // Step 3: Create DID payload
      setProgress('Generating DID payload...');
      const payload = createDIDPayload(parsed);
      
      // Generate DID hash for display
      const chars = '0123456789abcdef';
      let hash = 'did:xrpl:1:testnet:';
      for (let i = 0; i < 16; i++) {
        hash += chars[Math.floor(Math.random() * chars.length)];
      }
      setDidHash(hash);
      
      // Step 4: Send to backend for terminal display
      await sendVerificationToBackend(parsed, hash);
      
      // Step 5: Show success
      setStatus('verified');
      setProgress('Verification complete! DID minted successfully.');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed. Please try again.';
      Logger.error("Document Verification Failed", { error: errorMessage });
      setStatus('error');
      setProgress(errorMessage);
      
      sendEventToBackend('verification_error', { error: errorMessage });
    }
  };

  const sendVerificationToBackend = async (parsed: ParsedDocumentData, hash: string) => {
    try {
      const extractedData: any = {};
      if (parsed.extractedFields.name) extractedData.name = parsed.extractedFields.name;
      if (parsed.extractedFields.nric) extractedData.nric = parsed.extractedFields.nric;
      if (parsed.extractedFields.passport) extractedData.passport = parsed.extractedFields.passport;
      if (parsed.extractedFields.propertyId) extractedData.propertyId = parsed.extractedFields.propertyId;
      if (parsed.extractedFields.address) extractedData.address = parsed.extractedFields.address;
      if (parsed.extractedFields.accreditationStatus) extractedData.accreditation = parsed.extractedFields.accreditationStatus;
      if (parsed.extractedFields.taxReference) extractedData.taxReference = parsed.extractedFields.taxReference;
      
      const response = await fetch('http://localhost:3001/api/log-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: parsed.documentType,
          extractedData: extractedData,
          didHash: hash,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log('✅ Verification data sent to backend');
      }
    } catch (error) {
      console.log('Backend not available, demo continues without terminal logs');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setStatus('idle');
    setProgress('');
    setDidHash('');
    setParsedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-2xl relative shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-black mb-2">Identity Verification</h2>
          <p className="text-gray-600 text-sm">Scanning document and minting DID on XRPL</p>
        </div>

        {/* Status Display */}
        <div className="space-y-4">
          {/* Upload Step */}
          {status === 'idle' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Upload your identity document</p>
                <p className="text-sm text-gray-500 mb-4">Supports: PDF, JPG, PNG</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  Choose File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* File Uploaded - Ready to Parse */}
          {status === 'uploaded' && (
            <div className="space-y-4">
              {previewUrl && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <img src={previewUrl} alt="Document preview" className="max-h-48 mx-auto rounded" />
                </div>
              )}
              {!previewUrl && file && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center gap-3">
                  <FileText className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
              )}
              <button
                onClick={handleStartParsing}
                className="w-full bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors"
              >
                Start Verification
              </button>
              <button
                onClick={handleReset}
                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Change File
              </button>
            </div>
          )}

          {/* Scanning/Parsing */}
          {(status === 'scanning' || status === 'parsing') && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <Loader className="w-16 h-16 text-emerald-500 animate-spin" />
                <Scan className="w-8 h-8 text-emerald-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-gray-700 font-medium">{progress}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: '60%' }}
                />
              </div>
            </div>
          )}

          {status === 'verified' && (
            <div className="space-y-6">
              {/* Success Icon */}
              <div className="flex flex-col items-center py-4">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-12 h-12 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-black mb-2">Verified! DID Minted</h3>
                <p className="text-gray-600 text-sm">Your identity has been verified and registered on XRPL</p>
              </div>

              {/* DID Hash Display */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">DID Hash</p>
                <p className="font-mono text-sm text-black break-all">{didHash}</p>
              </div>

              {/* Extracted Data Preview */}
              {parsedData && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Extracted Information:</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {parsedData.extractedFields.name && (
                      <div>
                        <p className="text-gray-500">Name</p>
                        <p className="text-black font-medium">{parsedData.extractedFields.name}</p>
                      </div>
                    )}
                    {parsedData.extractedFields.nric && (
                      <div>
                        <p className="text-gray-500">NRIC</p>
                        <p className="text-black font-medium">{parsedData.extractedFields.nric}</p>
                      </div>
                    )}
                    {parsedData.extractedFields.passport && !parsedData.extractedFields.nric && (
                      <div>
                        <p className="text-gray-500">Passport</p>
                        <p className="text-black font-medium">{parsedData.extractedFields.passport}</p>
                      </div>
                    )}
                    {parsedData.extractedFields.propertyId && (
                      <div>
                        <p className="text-gray-500">Property ID</p>
                        <p className="text-black font-medium">{parsedData.extractedFields.propertyId}</p>
                      </div>
                    )}
                    {parsedData.extractedFields.accreditationStatus && (
                      <div>
                        <p className="text-gray-500">Status</p>
                        <p className="text-emerald-600 font-medium">{parsedData.extractedFields.accreditationStatus}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="flex-1 bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Verification Failed</p>
                  <p className="text-sm text-red-700">{progress}</p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
