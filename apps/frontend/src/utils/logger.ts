/**
 * Enhanced Logger Utility
 * 
 * Provides clear, visible logging for demo purposes.
 * Logs appear in browser console with styled formatting.
 * Also sends events to backend API for terminal visibility.
 * 
 * For terminal visibility:
 * 1. Start backend event logger: `yarn backend:events`
 * 2. Open browser DevTools (F12 or Cmd+Option+I)
 * 3. Go to Console tab
 * 4. Keep it visible during demo
 */

const BACKEND_API_URL = 'http://localhost:3001/event';

export class Logger {
  /**
   * Send event to backend API (non-blocking, fire-and-forget)
   */
  private static async sendToBackend(eventType: string, data?: any): Promise<void> {
    try {
      // Only send if backend is expected to be running (don't spam errors)
      await fetch(BACKEND_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: eventType,
          data: data || {}
        })
      }).catch(() => {
        // Silently fail - backend might not be running
        // This is fine for demo purposes
      });
    } catch (error) {
      // Ignore errors - backend might not be running
    }
  }

  private static formatMessage(type: string, message: string, data?: any): string {
    const timestamp = new Date().toLocaleTimeString();
    const separator = '═'.repeat(50);
    
    let output = `\n${separator}\n`;
    output += `[${timestamp}] ${type}\n`;
    output += `${separator}\n`;
    output += `${message}\n`;
    
    if (data) {
      output += `\nData:\n${JSON.stringify(data, null, 2)}\n`;
    }
    
    output += `${separator}\n`;
    
    return output;
  }

  static action(action: string, details?: any) {
    const message = this.formatMessage('🔵 ACTION', action, details);
    console.log(`%c${message}`, 'color: #3b82f6; font-weight: bold; font-size: 12px;');
    this.sendToBackend('action', { action, ...details });
    return message;
  }

  static success(message: string, data?: any) {
    const formatted = this.formatMessage('✅ SUCCESS', message, data);
    console.log(`%c${formatted}`, 'color: #10b981; font-weight: bold; font-size: 12px;');
    this.sendToBackend('success', { message, ...data });
    return formatted;
  }

  static error(message: string, error?: any) {
    const formatted = this.formatMessage('❌ ERROR', message, error);
    console.error(`%c${formatted}`, 'color: #ef4444; font-weight: bold; font-size: 12px;');
    return formatted;
  }

  static info(message: string, data?: any) {
    const formatted = this.formatMessage('ℹ️ INFO', message, data);
    console.info(`%c${formatted}`, 'color: #8b5cf6; font-weight: bold; font-size: 12px;');
    // Only send significant info events
    if (message.toLowerCase().includes('did') || message.toLowerCase().includes('ocr')) {
      const eventType = message.toLowerCase().includes('did') ? 'did_check' : 'ocr_scan';
      this.sendToBackend(eventType, { message, ...data });
    }
    return formatted;
  }

  static transaction(txType: string, details: any) {
    const message = `Transaction Type: ${txType}`;
    const formatted = this.formatMessage('📝 TRANSACTION', message, details);
    console.log(`%c${formatted}`, 'color: #f59e0b; font-weight: bold; font-size: 12px; background: #1f2937; padding: 8px;');
    this.sendToBackend('transaction_submit', { txType, ...details });
    return formatted;
  }

  static wallet(action: string, details?: any) {
    const formatted = this.formatMessage('💼 WALLET', action, details);
    console.log(`%c${formatted}`, 'color: #06b6d4; font-weight: bold; font-size: 12px;');
    // Map wallet actions to specific event types
    const eventType = action.toLowerCase().includes('connect') ? 'wallet_connect' :
                     action.toLowerCase().includes('disconnect') ? 'wallet_disconnect' :
                     'wallet_action';
    this.sendToBackend(eventType, { action, ...details });
    return formatted;
  }

  static oracle(price: string, asset: string) {
    const message = `Oracle Price: ${price} for ${asset}`;
    const formatted = this.formatMessage('📊 ORACLE', message);
    console.log(`%c${formatted}`, 'color: #6366f1; font-weight: bold; font-size: 12px;');
    return formatted;
  }

  static amm(action: string, details?: any) {
    const formatted = this.formatMessage('💧 AMM', action, details);
    console.log(`%c${formatted}`, 'color: #ec4899; font-weight: bold; font-size: 12px;');
    const eventType = action.toLowerCase().includes('initiate') || action.toLowerCase().includes('swap') 
      ? 'swap_initiate' : 'amm_action';
    this.sendToBackend(eventType, { action, ...details });
    return formatted;
  }

  static compliance(action: string) {
    const formatted = this.formatMessage('🛡️ COMPLIANCE', action);
    console.log(`%c${formatted}`, 'color: #eab308; font-weight: bold; font-size: 12px;');
    return formatted;
  }

  /**
   * Log DID minting event (sent to backend for terminal visibility)
   */
  static didMint(message: string, details?: any) {
    const formatted = this.formatMessage('✨ DID MINT', message, details);
    console.log(`%c${formatted}`, 'color: #8b5cf6; font-weight: bold; font-size: 12px;');
    this.sendToBackend('did_mint', { message, ...details });
    return formatted;
  }

  /**
   * Log OCR scanning event (sent to backend for terminal visibility)
   */
  static ocrScan(message: string, details?: any) {
    const formatted = this.formatMessage('📄 OCR SCAN', message, details);
    console.log(`%c${formatted}`, 'color: #06b6d4; font-weight: bold; font-size: 12px;');
    this.sendToBackend('ocr_scan', { message, ...details });
    return formatted;
  }

  /**
   * Log document parsing event (sent to backend for terminal visibility)
   */
  static documentParse(message: string, details?: any) {
    const formatted = this.formatMessage('🧠 DOCUMENT PARSE', message, details);
    console.log(`%c${formatted}`, 'color: #10b981; font-weight: bold; font-size: 12px;');
    this.sendToBackend('document_parse', { message, ...details });
    return formatted;
  }
}

/**
 * Log frontend action with clear formatting
 * Use this instead of console.log for demo visibility
 */
export function logAction(action: string, details?: any) {
  Logger.action(action, details);
  
  // Also log to window for potential terminal integration
  if (typeof window !== 'undefined') {
    (window as any).__RWAX_LAST_ACTION__ = {
      action,
      details,
      timestamp: new Date().toISOString()
    };
  }
}
