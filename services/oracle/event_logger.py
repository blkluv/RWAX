# services/oracle/event_logger.py
# RWAX Event Logger: Real-time Frontend-to-Backend Event Streaming
"""
Professional Terminal Event Logger for RWAX Protocol
Receives frontend events via HTTP API and displays them beautifully in the terminal.

This creates a real-time connection between frontend user actions and backend terminal logs,
perfect for demos where you want to show synchronized activity.
"""
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.live import Live
from rich.text import Text
from rich.rule import Rule

app = Flask(__name__)
CORS(app)  # Allow frontend to send requests

console = Console()
PORT = 3001

# Event history for tracking
event_history = []


def format_event(event_type: str, data: dict):
    """Format an event for beautiful terminal display"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    
    # Emoji mapping for different event types
    emoji_map = {
        'wallet_connect': '🔗',
        'wallet_disconnect': '🔌',
        'did_check': '🔍',
        'did_mint': '✨',
        'ocr_scan': '📄',
        'document_parse': '🧠',
        'document_upload': '📤',
        'pdf_extraction_start': '📄',
        'pdf_page_processing': '📃',
        'pdf_extraction_complete': '✅',
        'ocr_scan_start': '👁️',
        'ocr_progress': '⏳',
        'ocr_scan_complete': '✅',
        'document_parsing_start': '🔍',
        'swap_initiate': '💧',
        'swap_complete': '✅',
        'asset_view': '👁️',
        'verification_modal_open': '🛡️',
        'transaction_submit': '📝',
        'verification_error': '❌',
        'error': '❌',
    }
    
    emoji = emoji_map.get(event_type, '⚡')
    
    # Create formatted panel
    event_title = f"{emoji} [{timestamp}] {event_type.replace('_', ' ').title()}"
    
    # Format data as key-value pairs
    data_lines = []
    for key, value in data.items():
        if isinstance(value, (dict, list)):
            value = json.dumps(value, indent=2)[:100]  # Truncate long JSON
        data_lines.append(f"[cyan]{key}:[/cyan] {value}")
    
    data_text = "\n".join(data_lines)
    
    return Panel(
        f"[bold]{event_title}[/bold]\n\n{data_text}",
        border_style="green" if event_type != 'error' else "red",
        title=f"Frontend Event",
        title_align="left"
    )


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "service": "RWAX Event Logger"})


@app.route('/event', methods=['POST'])
def log_event():
    """Receive and log frontend events"""
    try:
        data = request.get_json()
        event_type = data.get('type', 'unknown')
        event_data = data.get('data', {})
        
        # Add timestamp
        event_data['_timestamp'] = datetime.now().isoformat()
        
        # Store in history
        event_history.append({
            'type': event_type,
            'data': event_data,
            'timestamp': datetime.now()
        })
        
        # Display beautifully in terminal
        panel = format_event(event_type, event_data)
        console.print(panel)
        
        # Special handling for specific events
        if event_type == 'wallet_connect':
            console.print(f"[bold green]→[/bold green] Wallet connected: [cyan]{event_data.get('address', 'N/A')}[/cyan]")
        elif event_type == 'did_mint':
            console.print(f"[bold green]→[/bold green] DID minted successfully: [cyan]{event_data.get('hash', 'N/A')}[/cyan]")
        elif event_type == 'swap_initiate':
            console.print(f"[bold cyan]→[/bold cyan] AMM swap initiated for: [yellow]{event_data.get('asset', 'N/A')}[/yellow]")
        elif event_type == 'document_upload':
            console.print(f"[bold cyan]→[/bold cyan] Document uploaded: [yellow]{event_data.get('fileName', 'N/A')}[/yellow] ([cyan]{event_data.get('fileSize', 'N/A')}[/cyan])")
        elif event_type == 'pdf_extraction_start':
            console.print(f"[bold blue]→[/bold blue] Starting PDF extraction: [cyan]{event_data.get('fileName', 'N/A')}[/cyan]")
        elif event_type == 'pdf_page_processing':
            console.print(f"[dim]   Processing page {event_data.get('page', '?')}/{event_data.get('totalPages', '?')}[/dim]")
        elif event_type == 'pdf_extraction_complete':
            console.print(f"[bold green]→[/bold green] PDF extraction complete: [cyan]{event_data.get('textLength', 0):,}[/cyan] characters from [yellow]{event_data.get('pages', 0)}[/yellow] pages")
        elif event_type == 'ocr_scan_start':
            console.print(f"[bold yellow]→[/bold yellow] Starting OCR scan: [cyan]{event_data.get('method', 'N/A')}[/cyan]")
        elif event_type == 'ocr_progress':
            console.print(f"[dim]   OCR progress: {event_data.get('progress', 0)}%[/dim]")
        elif event_type == 'ocr_scan_complete':
            console.print(f"[bold green]→[/bold green] OCR complete: [cyan]{event_data.get('textLength', 0):,}[/cyan] characters extracted ([yellow]{event_data.get('confidence', 0)}%[/yellow] confidence)")
        elif event_type == 'document_parsing_start':
            console.print(f"[bold magenta]→[/bold magenta] Starting document parsing with [cyan]{len(event_data.get('patterns', []))}[/cyan] extraction patterns")
        elif event_type == 'ocr_scan':
            console.print(f"[bold yellow]→[/bold yellow] OCR processing document: [cyan]{event_data.get('fileName', 'N/A')}[/cyan]")
        elif event_type == 'verification_error':
            console.print(f"[bold red]→[/bold red] Verification error: [red]{event_data.get('error', 'Unknown error')}[/red]")
        
        return jsonify({"status": "logged", "event_type": event_type})
    
    except Exception as e:
        console.print(f"[bold red]❌ Error logging event:[/bold red] {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/events', methods=['GET'])
def get_events():
    """Get event history (for debugging)"""
    return jsonify({
        "total": len(event_history),
        "events": event_history[-50:]  # Last 50 events
    })


@app.route('/api/log-verification', methods=['POST'])
def log_verification():
    """Demo endpoint: Log DID verification with extracted data"""
    try:
        data = request.get_json()
        
        # Extract verification data
        document_type = data.get('documentType', 'Unknown')
        extracted_data = data.get('extractedData', {})
        did_hash = data.get('didHash', 'N/A')
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        # Create a beautiful terminal display
        console.print("\n")
        console.rule(f"[bold magenta]📄 DID VERIFICATION - Real-Time Extracted Data[/bold magenta]")
        console.print(f"[dim][{timestamp}][/dim]")
        
        # Display extracted data in a table
        table = Table(show_header=True, header_style="bold magenta", border_style="magenta")
        table.add_column("Field", style="cyan", width=20)
        table.add_column("Value", style="white", width=40)
        
        table.add_row("Document Type", document_type)
        
        if extracted_data:
            for key, value in extracted_data.items():
                if value and value != "Not Found":
                    # Format the key nicely
                    display_key = key.replace(/([A-Z])/g, ' $1').strip().title()
                    table.add_row(display_key, str(value))
        
        table.add_row("DID Hash", f"[green]{did_hash}[/green]")
        table.add_row("Status", "[bold green]✓ Verified & Minted[/bold green]")
        
        console.print(table)
        console.print(f"[bold green]✅[/bold green] DID successfully minted on XRPL Testnet")
        console.print(f"[dim]Transaction Hash: {did_hash}[/dim]\n")
        console.rule("[dim]Verification Complete[/dim]\n")
        
        # Also log as regular event
        event_data = {
            'documentType': document_type,
            'extractedData': extracted_data,
            'didHash': did_hash,
            'timestamp': timestamp
        }
        
        panel = format_event('did_verification_demo', event_data)
        console.print(panel)
        
        return jsonify({
            "status": "logged",
            "message": "Verification data logged to terminal",
            "didHash": did_hash
        })
    
    except Exception as e:
        console.print(f"[bold red]❌ Error logging verification:[/bold red] {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


def print_banner():
    """Print startup banner"""
    banner = Panel.fit(
        "[bold magenta]🚀 RWAX EVENT LOGGER[/bold magenta]\n\n"
        "[cyan]Frontend-to-Backend Event Streaming[/cyan]\n"
        "[dim]Listening for frontend events...[/dim]",
        border_style="magenta",
        title="Server Starting",
        title_align="center"
    )
    console.print(banner)
    console.print(f"[green]✅[/green] Server running on [cyan]http://localhost:{PORT}[/cyan]")
    console.print("[dim]Waiting for frontend events...\n[/dim]")
    console.rule("[dim]Event Stream[/dim]")


if __name__ == '__main__':
    print_banner()
    app.run(port=PORT, debug=False, host='0.0.0.0')
