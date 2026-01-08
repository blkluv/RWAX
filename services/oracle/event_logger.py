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
        'swap_initiate': '💧',
        'swap_complete': '✅',
        'asset_view': '👁️',
        'verification_modal_open': '🛡️',
        'transaction_submit': '📝',
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
        elif event_type == 'ocr_scan':
            console.print(f"[bold yellow]→[/bold yellow] OCR processing document: [cyan]{event_data.get('fileName', 'N/A')}[/cyan]")
        
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
