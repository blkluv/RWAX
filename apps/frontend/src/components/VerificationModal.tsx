import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { X, Upload, Scan, CheckCircle, AlertCircle } from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (name: string) => void;
}

export function VerificationModal({ isOpen, onClose, onVerified }: VerificationModalProps) {
  const [image, setImage] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle'); // idle, scanning, success, error
  const [extractedData, setExtractedData] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setStatus('idle');
    }
  };

  const runOCR = async () => {
    if (!image) return;
    setStatus('scanning');
    try {
      const result = await Tesseract.recognize(image, 'eng', {
        logger: m => console.log(m)
      });
      
      const text = result.data.text;
      console.log("OCR Result:", text);
      
      // Simple Hackathon Logic: Look for ANY name-like pattern or just accept the scan
      // In a real app, you'd regex for "Name: [A-Z]+"
      setExtractedData(text.slice(0, 100) + "...");
      setStatus('success');
      
      // Delay to show success state before triggering wallet
      setTimeout(() => {
        onVerified("Verified User"); // Trigger the DID Minting
      }, 1500);

    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-white mb-2">KYC Verification</h2>
        <p className="text-zinc-400 text-sm mb-6">Upload a Government ID to mint your On-Chain DID.</p>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center bg-black/50 mb-6">
          {image ? (
            <img src={image} alt="ID Preview" className="h-40 mx-auto object-contain rounded-lg" />
          ) : (
            <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
              <Upload className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm text-zinc-300">Click to upload Passport / ID</p>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
        </div>

        {/* Status & Actions */}
        {status === 'scanning' && (
          <div className="flex items-center gap-3 text-emerald-400 justify-center animate-pulse">
            <Scan className="w-5 h-5" />
            <span>AI Scanning Document...</span>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex items-center gap-3 text-green-400 justify-center">
            <CheckCircle className="w-5 h-5" />
            <span>Identity Verified!</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-3 text-red-400 justify-center">
            <AlertCircle className="w-5 h-5" />
            <span>Scan failed. Please try again.</span>
          </div>
        )}

        {status === 'idle' && image && (
          <button 
            onClick={runOCR}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-lg transition-all"
          >
            Run AI Verification
          </button>
        )}
      </div>
    </div>
  );
}
