/**
 * Document Parser Utility
 * Extracts structured data from OCR results and validates against Singapore regulatory formats
 */

import CryptoJS from 'crypto-js';

// Singapore document patterns for validation
const PATTERNS = {
  // URA Property ID: URA- followed by numbers
  URA_PROPERTY_ID: /URA[-\s]?(\d{6,8})/i,
  // IRAS NOA: Multiple patterns
  IRAS_NOA: /(Notice of Assessment|NOA|IRAS)/i,
  // NRIC: S followed by 7 digits, 1 letter, 1 digit
  NRIC: /[STFG]\d{7}[A-Z]\d/,
  // Passport: Usually alphanumeric, 8-9 chars
  PASSPORT: /[A-Z]{1,2}\d{6,9}/,
  // Property Tax: Contains "Property Tax" or "IRAS"
  PROPERTY_TAX: /(Property\s+Tax|IRAS|Assessment\s+No)/i,
  // Accreditation indicators
  ACCREDITED: /(Accredited|Net\s+personal\s+assets|SGD\s*[>=]\s*2,?000,?000)/i,
  // Property Address patterns (Singapore postal codes)
  POSTAL_CODE: /\d{6}/,
  // Date formats (DD/MM/YYYY or DD-MM-YYYY)
  DATE: /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/,
};

export interface ParsedDocumentData {
  documentType: 'identity' | 'property' | 'accreditation' | 'unknown';
  extractedFields: {
    name?: string;
    nric?: string;
    passport?: string;
    propertyId?: string;
    propertyAddress?: string;
    accreditationStatus?: boolean;
    taxReference?: string;
    verificationHash?: string;
  };
  isValid: boolean;
  validationErrors: string[];
  rawText: string;
  hash: string;
}

/**
 * Generate SHA-256 hash of document content
 */
export function generateDocumentHash(text: string): string {
  return CryptoJS.SHA256(text).toString(CryptoJS.enc.Hex).toUpperCase();
}

/**
 * Extract name from OCR text (simple pattern matching)
 */
function extractName(text: string): string | undefined {
  // Look for patterns like "Name:", "Full Name:", etc.
  const namePatterns = [
    /(?:Name|Full\s+Name)[:]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /([A-Z][A-Z\s]{10,40})\s*(?:NRIC|Passport)/, // Name before NRIC/Passport
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Extract structured data from OCR text
 */
export function parseDocumentText(rawText: string): ParsedDocumentData {
  const result: ParsedDocumentData = {
    documentType: 'unknown',
    extractedFields: {},
    isValid: false,
    validationErrors: [],
    rawText,
    hash: generateDocumentHash(rawText),
  };

  console.log('📄 Starting document parsing...');
  console.log('Raw text length:', rawText.length, 'characters');

  // Extract NRIC
  const nricMatch = rawText.match(PATTERNS.NRIC);
  if (nricMatch) {
    result.extractedFields.nric = nricMatch[0];
    result.documentType = 'identity';
    console.log('✅ Found NRIC:', result.extractedFields.nric);
  }

  // Extract Passport
  const passportMatch = rawText.match(PATTERNS.PASSPORT);
  if (passportMatch && !result.extractedFields.nric) {
    result.extractedFields.passport = passportMatch[0];
    result.documentType = 'identity';
    console.log('✅ Found Passport:', result.extractedFields.passport);
  }

  // Extract Name
  const name = extractName(rawText);
  if (name) {
    result.extractedFields.name = name;
    console.log('✅ Found Name:', name);
  }

  // Extract URA Property ID
  const uraMatch = rawText.match(PATTERNS.URA_PROPERTY_ID);
  if (uraMatch) {
    result.extractedFields.propertyId = `URA-${uraMatch[1]}`;
    result.documentType = result.documentType === 'unknown' ? 'property' : result.documentType;
    console.log('✅ Found Property ID:', result.extractedFields.propertyId);
  }

  // Extract Property Address (look for postal code)
  const postalMatch = rawText.match(PATTERNS.POSTAL_CODE);
  if (postalMatch) {
    // Try to extract surrounding context as address
    const postalIndex = rawText.indexOf(postalMatch[0]);
    const addressContext = rawText.substring(Math.max(0, postalIndex - 50), postalIndex + 10);
    result.extractedFields.propertyAddress = addressContext.trim();
    console.log('✅ Found Address (with postal code):', postalMatch[0]);
  }

  // Check for Accreditation status
  if (PATTERNS.ACCREDITED.test(rawText)) {
    result.extractedFields.accreditationStatus = true;
    result.documentType = 'accreditation';
    console.log('✅ Found Accreditation indicators');
  }

  // Check for IRAS/Property Tax
  if (PATTERNS.IRAS_NOA.test(rawText) || PATTERNS.PROPERTY_TAX.test(rawText)) {
    result.extractedFields.taxReference = 'IRAS-REF';
    console.log('✅ Found IRAS/Property Tax reference');
  }

  // Validation
  if (result.documentType === 'identity') {
    if (!result.extractedFields.name && !result.extractedFields.nric && !result.extractedFields.passport) {
      result.validationErrors.push('Identity document missing name or ID number');
    } else {
      result.isValid = true;
    }
  } else if (result.documentType === 'property') {
    if (!result.extractedFields.propertyId) {
      result.validationErrors.push('Property document missing URA Property ID');
    } else {
      result.isValid = true;
    }
  } else if (result.documentType === 'accreditation') {
    result.isValid = result.extractedFields.accreditationStatus === true;
  } else {
    result.validationErrors.push('Could not determine document type');
  }

  // Always set hash
  result.extractedFields.verificationHash = result.hash;

  console.log('📊 Parsing Results:');
  console.log('  Document Type:', result.documentType);
  console.log('  Valid:', result.isValid);
  console.log('  Fields Extracted:', Object.keys(result.extractedFields).length);
  if (result.validationErrors.length > 0) {
    console.log('  ⚠️  Errors:', result.validationErrors);
  }

  return result;
}

/**
 * Create compact JSON payload for DID (must be < 256 bytes)
 * Format: {"v":1,"p":"URA-123","a":true,"k":true,"h":"abc123..."}
 */
export function createDIDPayload(parsedData: ParsedDocumentData): string {
  const payload: any = {
    v: 1, // version
  };

  // Property ID (if available)
  if (parsedData.extractedFields.propertyId) {
    payload.p = parsedData.extractedFields.propertyId;
  }

  // Accreditation status
  if (parsedData.extractedFields.accreditationStatus !== undefined) {
    payload.a = parsedData.extractedFields.accreditationStatus;
  }

  // KYC verified (if identity document)
  if (parsedData.documentType === 'identity' && parsedData.isValid) {
    payload.k = true;
  }

  // Hash of document
  payload.h = parsedData.hash.substring(0, 16); // Truncate to save space

  // Name (first 20 chars max)
  if (parsedData.extractedFields.name) {
    payload.n = parsedData.extractedFields.name.substring(0, 20);
  }

  const jsonString = JSON.stringify(payload);
  const jsonBytes = new TextEncoder().encode(jsonString).length;

  console.log('📦 DID Payload Created:');
  console.log('  JSON:', jsonString);
  console.log('  Size:', jsonBytes, 'bytes (max 256 bytes)');

  if (jsonBytes > 256) {
    console.error('❌ Payload exceeds 256 bytes! Truncating...');
    // Remove optional fields if too large
    delete payload.n;
    const truncatedJson = JSON.stringify(payload);
    const truncatedBytes = new TextEncoder().encode(truncatedJson).length;
    console.log('  Truncated size:', truncatedBytes, 'bytes');
    return truncatedJson;
  }

  return jsonString;
}
