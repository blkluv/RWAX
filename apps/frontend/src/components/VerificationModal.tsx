import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { X, Upload, Scan, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { parseDocumentText, createDIDPayload, type ParsedDocumentData } from '../utils/documentParser';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (parsedData: ParsedDocumentData, didPayload: string) => void;
  alreadyVerified?: boolean;
}

export function VerificationModal({ isOpen, onClose, onVerified, alreadyVerified = false }: VerificationModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle'); // idle, scanning, parsing, success, error
  const [parsedData, setParsedData] = useState<ParsedDocumentData | null>(null);
  const [didPayload, setDidPayload] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setStatus('idle');
      
      // Create preview URL
      if (uploadedFile.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(uploadedFile));
      } else if (uploadedFile.type === 'application/pdf') {
        // For PDFs, we'll show a placeholder
        setPreviewUrl(null);
      }
      
      // Reset previous results
      setParsedData(null);
      setDidPayload(null);
      setProgress('');
    }
  };

  /**
   * Extract text from PDF using pdfjs
   */
  const extractTextFromPDF = async (file: File): Promise<string> => {
    console.log('📄 Extracting text from PDF...');
    setProgress('Reading PDF document...');
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    console.log(`  Total pages: ${pdf.numPages}`);
    
    for (let i = 1; i <= pdf.numPages; i++) {
      setProgress(`Processing page ${i} of ${pdf.numPages}...`);
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
      console.log(`  Page ${i} extracted (${pageText.length} chars)`);
    }
    
    console.log(`✅ PDF text extracted: ${fullText.length} total characters`);
    return fullText;
  };

  /**
   * Extract text from image using Tesseract OCR
   */
  const extractTextFromImage = async (imageUrl: string): Promise<string> => {
    console.log('🖼️  Extracting text from image using OCR...');
    setProgress('Running AI OCR on image...');
    
    const result = await Tesseract.recognize(imageUrl, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          setProgress(`OCR: ${Math.round(m.progress * 100)}%`);
          console.log(`  OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    console.log(`✅ OCR completed: ${result.data.text.length} characters extracted`);
    return result.data.text;
  };

  const runVerification = async () => {
    if (!file) return;
    
    setStatus('scanning');
    setProgress('Starting document verification...');
    
    try {
      console.log('═══════════════════════════════════════');
      console.log('🔍 DOCUMENT VERIFICATION PIPELINE');
      console.log('═══════════════════════════════════════');
      console.log(`File: ${file.name}`);
      console.log(`Type: ${file.type}`);
      console.log(`Size: ${(file.size / 1024).toFixed(2)} KB`);
      console.log('───────────────────────────────────────');
      
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
        console.log('───────────────────────────────────────');
        console.log('🔍 PARSING DOCUMENT CONTENT...');
        console.log('Looking for:');
        console.log('  • Singapore NRIC (S/T/F/G + 7 digits + letter + digit)');
        console.log('  • Passport numbers (alphanumeric, 8-9 chars)');
        console.log('  • Full names (patterns like "Name:", "Full Name:")');
        console.log('  • URA Property IDs (URA- followed by 6-8 digits)');
        console.log('  • Property addresses (Singapore postal codes: 6 digits)');
        console.log('  • Accreditation indicators (keywords like "Accredited", "SGD 2,000,000")');
        console.log('  • IRAS tax references ("IRAS", "Notice of Assessment")');
        console.log('───────────────────────────────────────');
        const parsed = parseDocumentText(extractedText);
        setParsedData(parsed);
        
        // Log what was found
        console.log('═══════════════════════════════════════');
        console.log('📊 EXTRACTION SUMMARY:');
        console.log('═══════════════════════════════════════');
        if (parsed.extractedFields.name) {
          console.log(`✅ Name found: "${parsed.extractedFields.name}"`);
        } else {
          console.log('❌ Name: NOT FOUND (look for "Name:" or "Full Name:" in document)');
        }
        
        if (parsed.extractedFields.nric) {
          console.log(`✅ NRIC found: "${parsed.extractedFields.nric}" (Singapore ID)`);
        } else if (parsed.extractedFields.passport) {
          console.log(`✅ Passport found: "${parsed.extractedFields.passport}"`);
        } else {
          console.log('❌ ID Number: NOT FOUND (look for NRIC format: S1234567A or passport number)');
        }
        
        if (parsed.extractedFields.propertyId) {
          console.log(`✅ Property ID found: "${parsed.extractedFields.propertyId}"`);
        } else {
          console.log('❌ Property ID: NOT FOUND (look for "URA-" followed by numbers)');
        }
        
        if (parsed.extractedFields.propertyAddress) {
          console.log(`✅ Property Address found: "${parsed.extractedFields.propertyAddress.substring(0, 50)}..."`);
        } else {
          console.log('❌ Property Address: NOT FOUND (look for Singapore postal codes: 6 digits)');
        }
        
        if (parsed.extractedFields.accreditationStatus) {
          console.log(`✅ Accreditation Status: VERIFIED (found accreditation indicators)`);
        } else {
          console.log('❌ Accreditation: NOT DETECTED (look for "Accredited" or "SGD 2,000,000" keywords)');
        }
        
        if (parsed.extractedFields.taxReference) {
          console.log(`✅ Tax Reference found: "${parsed.extractedFields.taxReference}"`);
        }
        
        console.log(`📝 Document Hash: ${parsed.hash}`);
        console.log(`📄 Document Type: ${parsed.documentType}`);
        console.log(`✓ Valid: ${parsed.isValid}`);
        console.log('═══════════════════════════════════════');
      
      // Step 3: Create DID payload
      setProgress('Generating DID payload...');
      console.log('───────────────────────────────────────');
      const payload = createDIDPayload(parsed);
      setDidPayload(payload);
      
      // Step 4: Show success
      setStatus('success');
      setProgress('Document verified successfully!');
      
      console.log('═══════════════════════════════════════');
      console.log('✅ VERIFICATION COMPLETE');
      console.log('═══════════════════════════════════════');
      console.log('Ready to mint DID with payload:', payload);
      console.log('═══════════════════════════════════════');
      
      // If already verified, just show results without minting
      if (alreadyVerified) {
        console.log('ℹ️  Already verified - showing results only (no DID minting)');
        setProgress('Document parsed successfully! (Already verified, no transaction needed)');
        // Don't call onVerified callback if already verified
        return;
      }
      
      // Delay to show success state before triggering wallet
      setTimeout(() => {
        onVerified(parsed, payload);
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed. Please try again.';
      console.error('❌ Verification failed:', err);
      setStatus('error');
      setProgress(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-white mb-2">
          {alreadyVerified ? '🧪 Test OCR & Document Parsing' : 'KYC Verification'}
        </h2>
        <p className="text-zinc-400 text-sm mb-6">
          {alreadyVerified 
            ? 'You are already verified. Upload documents to test OCR and parsing functionality.'
            : 'Upload identity, property, or accreditation documents (PDF or Image)'}
        </p>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center bg-black/50 mb-6">
          {previewUrl ? (
            <img src={previewUrl} alt="Document Preview" className="h-40 mx-auto object-contain rounded-lg" />
          ) : file && file.type === 'application/pdf' ? (
            <div className="flex flex-col items-center">
              <FileText className="w-16 h-16 text-emerald-500 mb-3" />
              <p className="text-sm text-zinc-300">{file.name}</p>
              <p className="text-xs text-zinc-500 mt-1">PDF Document</p>
            </div>
          ) : (
            <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
              <Upload className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm text-zinc-300">Click to upload PDF or Image</p>
              <p className="text-xs text-zinc-500 mt-1">Supports: PDF, JPG, PNG</p>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            className="hidden" 
            accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf" 
          />
        </div>
        
        {/* Progress Indicator */}
        {progress && (
          <div className="mb-4 text-center">
            <p className="text-xs text-zinc-400">{progress}</p>
          </div>
        )}
        
        {/* Parsed Data Preview - Detailed */}
        {parsedData && status === 'success' && (
          <div className="mb-4 space-y-3 max-h-96 overflow-y-auto">
            {/* Document Type & Validation Status */}
            <div className="p-3 bg-black/50 rounded-lg border border-emerald-500/30">
              <p className="text-xs font-bold text-emerald-400 mb-2">📄 Document Analysis:</p>
              <div className="text-xs text-zinc-300 space-y-1">
                <p>
                  <span className="text-zinc-500">Type:</span>{' '}
                  <span className="capitalize font-medium">
                    {parsedData.documentType === 'identity' && '🆔 Identity Document'}
                    {parsedData.documentType === 'property' && '🏠 Property Document'}
                    {parsedData.documentType === 'accreditation' && '✅ Accreditation Document'}
                    {parsedData.documentType === 'unknown' && '❓ Unknown/Other'}
                  </span>
                </p>
                <p>
                  <span className="text-zinc-500">Validation:</span>{' '}
                  <span className={parsedData.isValid ? 'text-green-400 font-medium' : 'text-yellow-400 font-medium'}>
                    {parsedData.isValid ? '✅ Valid Document' : '⚠️ Needs Review'}
                  </span>
                </p>
                <p>
                  <span className="text-zinc-500">Text Extracted:</span>{' '}
                  {parsedData.rawText.length.toLocaleString()} characters
                </p>
              </div>
            </div>

            {/* Extracted Fields - Detailed */}
            <div className="p-3 bg-black/50 rounded-lg border border-emerald-500/30">
              <p className="text-xs font-bold text-emerald-400 mb-3">🔍 Extracted Information:</p>
              <div className="text-xs text-zinc-300 space-y-3">
                {/* Name */}
                {parsedData.extractedFields.name ? (
                  <div className="bg-zinc-900/50 p-2 rounded">
                    <p className="text-zinc-500 text-[10px] uppercase mb-1">Full Name</p>
                    <p className="font-mono text-sm">{parsedData.extractedFields.name}</p>
                    <p className="text-zinc-600 text-[10px] mt-1">✓ Extracted from document text</p>
                  </div>
                ) : (
                  <div className="bg-zinc-900/30 p-2 rounded border border-zinc-700">
                    <p className="text-zinc-600 text-[10px] uppercase mb-1">Full Name</p>
                    <p className="text-zinc-600 italic">Not detected (looking for "Name:", "Full Name:" patterns)</p>
                  </div>
                )}
                
                {/* NRIC or Passport */}
                {parsedData.extractedFields.nric ? (
                  <div className="bg-zinc-900/50 p-2 rounded">
                    <p className="text-zinc-500 text-[10px] uppercase mb-1">NRIC (Singapore ID)</p>
                    <p className="font-mono text-sm">{parsedData.extractedFields.nric}</p>
                    <p className="text-zinc-600 text-[10px] mt-1">
                      Format: S/T/F/G + 7 digits + letter + digit (e.g., S1234567A)
                    </p>
                  </div>
                ) : parsedData.extractedFields.passport ? (
                  <div className="bg-zinc-900/50 p-2 rounded">
                    <p className="text-zinc-500 text-[10px] uppercase mb-1">Passport Number</p>
                    <p className="font-mono text-sm">{parsedData.extractedFields.passport}</p>
                    <p className="text-zinc-600 text-[10px] mt-1">International passport identifier</p>
                  </div>
                ) : (
                  <div className="bg-zinc-900/30 p-2 rounded border border-zinc-700">
                    <p className="text-zinc-600 text-[10px] uppercase mb-1">ID Number</p>
                    <p className="text-zinc-600 italic">Not detected (looking for NRIC: S1234567A or passport format)</p>
                  </div>
                )}
                
                {/* Property ID */}
                {parsedData.extractedFields.propertyId ? (
                  <div className="bg-zinc-900/50 p-2 rounded">
                    <p className="text-zinc-500 text-[10px] uppercase mb-1">URA Property ID</p>
                    <p className="font-mono text-sm">{parsedData.extractedFields.propertyId}</p>
                    <p className="text-zinc-600 text-[10px] mt-1">
                      Singapore Land Authority property identifier (format: URA-XXXXXX)
                    </p>
                  </div>
                ) : (
                  <div className="bg-zinc-900/30 p-2 rounded border border-zinc-700">
                    <p className="text-zinc-600 text-[10px] uppercase mb-1">Property ID</p>
                    <p className="text-zinc-600 italic">Not detected (looking for "URA-" followed by 6-8 digits)</p>
                  </div>
                )}
                
                {/* Property Address */}
                {parsedData.extractedFields.propertyAddress && (
                  <div className="bg-zinc-900/50 p-2 rounded">
                    <p className="text-zinc-500 text-[10px] uppercase mb-1">Property Address</p>
                    <p className="text-sm break-words">{parsedData.extractedFields.propertyAddress.substring(0, 150)}...</p>
                    <p className="text-zinc-600 text-[10px] mt-1">Extracted from context around postal code</p>
                  </div>
                )}
                
                {/* Accreditation Status */}
                {parsedData.extractedFields.accreditationStatus !== undefined ? (
                  <div className="bg-zinc-900/50 p-2 rounded">
                    <p className="text-zinc-500 text-[10px] uppercase mb-1">Accredited Investor Status</p>
                    <p className={parsedData.extractedFields.accreditationStatus ? 'text-green-400 font-medium text-sm' : 'text-zinc-600 text-sm'}>
                      {parsedData.extractedFields.accreditationStatus ? '✅ Accredited Investor' : '❌ Not Accredited'}
                    </p>
                    <p className="text-zinc-600 text-[10px] mt-1">
                      {parsedData.extractedFields.accreditationStatus 
                        ? 'Found keywords: "Accredited", "SGD 2,000,000", "Net personal assets"'
                        : 'No accreditation indicators found'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-zinc-900/30 p-2 rounded border border-zinc-700">
                    <p className="text-zinc-600 text-[10px] uppercase mb-1">Accreditation Status</p>
                    <p className="text-zinc-600 italic">Not checked (look for "Accredited" or "SGD 2,000,000" keywords)</p>
                  </div>
                )}
                
                {/* Tax Reference */}
                {parsedData.extractedFields.taxReference && (
                  <div className="bg-zinc-900/50 p-2 rounded">
                    <p className="text-zinc-500 text-[10px] uppercase mb-1">Tax Reference</p>
                    <p className="font-mono text-sm">{parsedData.extractedFields.taxReference}</p>
                    <p className="text-zinc-600 text-[10px] mt-1">IRAS Notice of Assessment or Property Tax detected</p>
                  </div>
                )}

                {/* Document Hash */}
                <div className="pt-2 border-t border-zinc-700 bg-zinc-900/50 p-2 rounded">
                  <p className="text-zinc-500 text-[10px] uppercase mb-1">Document Hash (SHA-256)</p>
                  <p className="font-mono text-xs break-all bg-black/50 p-2 rounded">
                    {parsedData.hash}
                  </p>
                  <p className="text-zinc-600 text-[10px] mt-1">
                    Cryptographic fingerprint of document content (used for verification proof)
                  </p>
                </div>
              </div>
            </div>

            {/* Validation Errors/Warnings */}
            {parsedData.validationErrors.length > 0 && (
              <div className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
                <p className="text-xs font-bold text-yellow-400 mb-2">⚠️ Validation Warnings:</p>
                <ul className="text-xs text-yellow-300 space-y-1 list-disc list-inside">
                  {parsedData.validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Status & Actions */}
        {(status === 'scanning' || status === 'parsing') && (
          <div className="flex items-center gap-3 text-emerald-400 justify-center animate-pulse">
            <Scan className="w-5 h-5" />
            <span>
              {status === 'scanning' ? 'AI Scanning Document...' : 'Parsing & Validating...'}
            </span>
          </div>
        )}
        
        {status === 'success' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-green-400 justify-center">
              <CheckCircle className="w-5 h-5" />
              <span>Document Verified!</span>
            </div>
              {didPayload && (
                <div className="space-y-2">
                  <div className="text-xs text-zinc-400 p-3 bg-black/50 rounded-lg border border-zinc-700">
                    <p className="font-bold text-emerald-400 mb-2">📦 DID Payload (for on-chain storage):</p>
                    <p className="font-mono break-all text-[10px] mb-3 bg-zinc-900/50 p-2 rounded">{didPayload}</p>
                    <div className="space-y-1 text-[10px] text-zinc-500">
                      <p className="font-bold text-zinc-400 mb-1">Payload Fields Explained:</p>
                      <p><span className="text-emerald-400 font-mono">"v"</span>: Version (always 1)</p>
                      {didPayload.includes('"k"') && (
                        <p><span className="text-emerald-400 font-mono">"k"</span>: KYC Verified = true (identity document detected)</p>
                      )}
                      {didPayload.includes('"p"') && (
                        <p><span className="text-emerald-400 font-mono">"p"</span>: Property ID (URA identifier if found)</p>
                      )}
                      {didPayload.includes('"a"') && (
                        <p><span className="text-emerald-400 font-mono">"a"</span>: Accredited Investor status (true/false)</p>
                      )}
                      {didPayload.includes('"n"') && (
                        <p><span className="text-emerald-400 font-mono">"n"</span>: Name (first 20 characters)</p>
                      )}
                      {didPayload.includes('"h"') && (
                        <p><span className="text-emerald-400 font-mono">"h"</span>: Document Hash (first 16 chars of SHA-256)</p>
                      )}
                      <p className="mt-2 pt-2 border-t border-zinc-700 text-zinc-600">
                        💡 This compact JSON will be stored on XRPL DID field (max 256 bytes). 
                        Raw documents stay off-chain for privacy.
                      </p>
                    </div>
                  </div>
                  
                  {/* Raw OCR Text Preview (collapsible) */}
                  {parsedData && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-zinc-400 hover:text-white mb-2 p-2 bg-black/50 rounded">
                        🔍 Show Raw OCR Text (First 500 chars)
                      </summary>
                      <div className="p-2 bg-black/50 rounded border border-zinc-700 max-h-32 overflow-y-auto">
                        <pre className="font-mono text-[10px] text-zinc-400 whitespace-pre-wrap break-words">
                          {parsedData.rawText.substring(0, 500)}
                          {parsedData.rawText.length > 500 ? '\n...\n(truncated)' : ''}
                        </pre>
                      </div>
                    </details>
                  )}
                </div>
              )}
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-3 text-red-400 justify-center">
            <AlertCircle className="w-5 h-5" />
            <span>{progress || 'Verification failed. Please try again.'}</span>
          </div>
        )}

        {status === 'idle' && file && (
          <button 
            onClick={runVerification}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Run AI Verification
          </button>
        )}
      </div>
    </div>
  );
}
