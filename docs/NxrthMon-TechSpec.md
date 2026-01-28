# NxrthMon - Technical Specification Document

**Product Name:** NxrthMon
**Category:** System Resource Monitor
**Version:** 1.0 (Initial Specification)
**Last Updated:** 2026-01-28

---

## Executive Summary

NxrthMon is a lightweight, privacy-focused system resource monitoring application for Windows that differentiates itself from built-in tools (Task Manager, Resource Monitor) through historical tracking, intelligent alerts, and a clean customizable interface.

### Core Value Propositions

1. **Historical Data** - See what happened when you weren't watching
2. **Actionable Alerts** - Get notified before problems escalate
3. **Clean UX** - Modern interface vs. Windows' cluttered legacy tools
4. **Privacy-First** - All data stays local, no telemetry
5. **Lightweight** - Minimal resource footprint (ironic for a monitor to be heavy)

---

## Target Platforms

| Platform | Priority | Notes |
|----------|----------|-------|
| Windows 10/11 | Primary | x64, ARM64 |
| Windows Server | Secondary | v2+ consideration |
| macOS | Future | v3+ consideration |
| Linux | Future | v3+ consideration |

---

## Technology Stack (Recommended)

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Runtime** | .NET 8+ / Rust | Performance-critical, low overhead |
| **UI Framework** | WPF / WinUI 3 | Native Windows look, hardware acceleration |
| **Data Storage** | SQLite | Lightweight, local, no server needed |
| **Charting** | LiveCharts2 / ScottPlot | Real-time capable, performant |
| **System APIs** | WMI, PDH, ETW | Windows performance counters |
| **Tray Icon** | Native Win32 | Reliable system tray integration |

---

## Feature Roadmap

### Version 1.0 - MVP

**Goal:** A cleaner, more useful Task Manager replacement with basic history.

**Release Target:** Initial Launch

---

#### 1.1 Real-Time Dashboard

| Feature | Description | Priority |
|---------|-------------|----------|
| CPU Monitoring | Overall CPU usage percentage, per-core breakdown | P0 |
| RAM Monitoring | Used/Available/Cached memory with percentage | P0 |
| Disk Monitoring | Read/Write speeds, active time per drive | P0 |
| Network Monitoring | Upload/Download speeds, total transferred | P0 |
| GPU Monitoring | GPU usage percentage, VRAM usage (if available) | P1 |
| Refresh Rate | Configurable 1s / 2s / 5s intervals | P0 |

**Technical Requirements:**
- Use Performance Counters (PDH) for CPU, RAM, Disk
- Use NetworkInterface class for network stats
- Use NVAPI/AMD ADL or WMI for GPU stats
- Maximum CPU usage of monitor itself: <1% at 1s refresh

---

#### 1.2 Process List

| Feature | Description | Priority |
|---------|-------------|----------|
| Process Table | Name, PID, CPU%, RAM, Disk I/O, Network | P0 |
| Sorting | Click column headers to sort | P0 |
| Filtering | Search/filter by process name | P0 |
| Process Actions | End task, open file location | P1 |
| Process Details | Double-click for detailed view | P1 |
| Group by Application | Combine Chrome tabs, etc. | P2 |

**Technical Requirements:**
- Use System.Diagnostics.Process with performance counters
- Refresh process list every 2-5 seconds (configurable)
- Handle access denied for system processes gracefully

---

#### 1.3 Historical Graphs (24-48 Hours)

| Feature | Description | Priority |
|---------|-------------|----------|
| Timeline View | Scrollable/zoomable time-based graphs | P0 |
| Data Points | Store readings every 5 seconds | P0 |
| Metrics Covered | CPU, RAM, Disk, Network (aggregate) | P0 |
| Data Retention | 48 hours rolling window | P0 |
| Hover Details | Show exact values on hover | P1 |
| Event Markers | Mark when alerts triggered | P2 |

**Technical Requirements:**
- SQLite database for storage (~50MB for 48 hours at 5s intervals)
- Background service to collect data even when UI closed
- Efficient querying for graph rendering (aggregation for long timespans)

**Database Schema (v1):**
```sql
CREATE TABLE system_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,  -- Unix timestamp
    cpu_percent REAL,
    ram_used_mb INTEGER,
    ram_total_mb INTEGER,
    disk_read_bytes INTEGER,
    disk_write_bytes INTEGER,
    net_sent_bytes INTEGER,
    net_recv_bytes INTEGER,
    gpu_percent REAL,
    gpu_vram_mb INTEGER
);

CREATE INDEX idx_metrics_timestamp ON system_metrics(timestamp);

CREATE TABLE process_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    process_name TEXT NOT NULL,
    pid INTEGER,
    cpu_percent REAL,
    ram_mb INTEGER,
    disk_read_bytes INTEGER,
    disk_write_bytes INTEGER,
    net_bytes INTEGER
);

CREATE INDEX idx_process_timestamp ON process_metrics(timestamp);
CREATE INDEX idx_process_name ON process_metrics(process_name);
```

---

#### 1.4 System Tray Integration

| Feature | Description | Priority |
|---------|-------------|----------|
| Tray Icon | Persistent icon with dynamic indicator | P0 |
| Quick Stats Tooltip | Hover to see CPU/RAM/Network | P0 |
| Context Menu | Open, Settings, Exit | P0 |
| Minimize to Tray | Close button minimizes, doesn't exit | P0 |
| Start Minimized | Option to launch to tray only | P1 |

**Technical Requirements:**
- NotifyIcon with custom drawing for dynamic stats
- Single instance application enforcement
- Startup registration (optional, user-controlled)

---

#### 1.5 Basic Alerts

| Feature | Description | Priority |
|---------|-------------|----------|
| CPU Threshold Alert | Notify when CPU > X% for Y seconds | P0 |
| RAM Threshold Alert | Notify when RAM > X% for Y seconds | P0 |
| Custom Thresholds | User-configurable values | P0 |
| Toast Notifications | Windows native notifications | P0 |
| Alert Cooldown | Don't spam (configurable cooldown) | P1 |
| Alert History | Log of past alerts | P2 |

**Default Alert Settings:**
- CPU: >90% for 60 seconds
- RAM: >85% for 30 seconds
- Cooldown: 5 minutes between same alert type

---

#### 1.6 Settings & Preferences

| Feature | Description | Priority |
|---------|-------------|----------|
| Theme | Light / Dark / System | P0 |
| Refresh Rate | 1s / 2s / 5s | P0 |
| Start with Windows | Optional startup registration | P1 |
| Start Minimized | Launch to tray | P1 |
| Data Retention | Configure history length | P1 |
| Alert Configuration | Thresholds and cooldowns | P0 |

---

### Version 2.0 - Enhanced Monitoring

**Goal:** Add hardware health, network intelligence, and data export capabilities.

**Release Target:** 3-4 months post-MVP

---

#### 2.1 Temperature & Hardware Health

| Feature | Description | Priority |
|---------|-------------|----------|
| CPU Temperature | Current temp, min/max/average | P0 |
| GPU Temperature | Current temp with graph | P0 |
| Fan Speeds | RPM for detected fans | P1 |
| Thermal Throttling Detection | Alert when CPU/GPU throttles | P0 |
| Temperature History | Add to historical graphs | P0 |
| Hardware Info Panel | CPU model, RAM specs, GPU model | P1 |

**Technical Requirements:**
- Use LibreHardwareMonitor library (open source) or WMI
- Handle systems without sensors gracefully
- Temperature alerts (>85°C warning, >95°C critical)

**Database Schema Addition (v2):**
```sql
ALTER TABLE system_metrics ADD COLUMN cpu_temp_c REAL;
ALTER TABLE system_metrics ADD COLUMN gpu_temp_c REAL;
ALTER TABLE system_metrics ADD COLUMN fan_rpm INTEGER;
ALTER TABLE system_metrics ADD COLUMN is_throttling INTEGER;
```

---

#### 2.2 Network Intelligence

| Feature | Description | Priority |
|---------|-------------|----------|
| Per-Process Bandwidth | Which apps use most bandwidth | P0 |
| Bandwidth History | Daily/weekly/monthly per app | P0 |
| Connection List | Active connections per process | P1 |
| Unexpected Activity Detection | Alert on unusual network usage | P2 |
| Bandwidth Limits | Warn when app exceeds threshold | P2 |

**Technical Requirements:**
- Use ETW (Event Tracing for Windows) for per-process network
- Alternative: Windows Filtering Platform (WFP)
- Store aggregated daily totals to save space

**Database Schema Addition (v2):**
```sql
CREATE TABLE network_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,  -- YYYY-MM-DD
    process_name TEXT NOT NULL,
    bytes_sent INTEGER DEFAULT 0,
    bytes_received INTEGER DEFAULT 0,
    UNIQUE(date, process_name)
);
```

---

#### 2.3 Extended Historical Data

| Feature | Description | Priority |
|---------|-------------|----------|
| 7-Day History | Full resolution for 7 days | P0 |
| 30-Day History | Hourly averages for 30 days | P0 |
| 90-Day History | Daily averages for 90 days | P1 |
| Data Aggregation | Automatic rollup of old data | P0 |
| Storage Management | Show database size, cleanup options | P1 |

**Technical Requirements:**
- Background job to aggregate old data
- Separate tables for hourly/daily aggregates
- Target database size: <500MB for 90 days

---

#### 2.4 Startup Impact Analysis

| Feature | Description | Priority |
|---------|-------------|----------|
| Boot Time Tracking | Measure time from power on to desktop ready | P0 |
| Per-App Boot Impact | Time added by each startup app | P0 |
| Startup App List | Show all startup items with enable/disable | P0 |
| Recommendations | Suggest items to disable | P1 |
| Boot History | Track boot times over time | P1 |

**Technical Requirements:**
- Use Windows Event Log for boot timing
- Registry + Task Scheduler + Startup folder scanning
- Measure post-boot CPU settling time

---

#### 2.5 Export Capabilities

| Feature | Description | Priority |
|---------|-------------|----------|
| Export to CSV | All metrics, configurable date range | P0 |
| Export to JSON | Structured data for developers | P0 |
| Scheduled Exports | Auto-export daily/weekly | P2 |
| Quick Share | Copy current stats to clipboard | P1 |

---

### Version 3.0 - Power User Edition

**Goal:** Full customization, advanced analytics, and comprehensive reporting.

**Release Target:** 6-8 months post-MVP

---

#### 3.1 Advanced Smart Alerts

| Feature | Description | Priority |
|---------|-------------|----------|
| Compound Conditions | "CPU > 80% AND RAM > 70%" | P0 |
| Process-Specific Alerts | "Alert if Chrome uses > 4GB RAM" | P0 |
| Time-Based Rules | "Only alert during work hours" | P1 |
| Alert Actions | Run script, send webhook, email | P1 |
| Alert Profiles | Gaming mode, Work mode, etc. | P2 |
| Anomaly Detection | ML-based unusual activity detection | P3 |

**Alert Rule Schema (v3):**
```json
{
  "name": "High Chrome Memory",
  "enabled": true,
  "conditions": [
    {"metric": "process.ram_mb", "process": "chrome", "operator": ">", "value": 4096}
  ],
  "logic": "AND",
  "duration_seconds": 30,
  "cooldown_minutes": 15,
  "schedule": {
    "enabled": true,
    "days": ["Mon", "Tue", "Wed", "Thu", "Fri"],
    "start_time": "09:00",
    "end_time": "18:00"
  },
  "actions": [
    {"type": "notification", "title": "Chrome Memory Warning"},
    {"type": "webhook", "url": "https://..."}
  ]
}
```

---

#### 3.2 Per-Application Long-Term Analytics

| Feature | Description | Priority |
|---------|-------------|----------|
| App Resource Profiles | Average CPU/RAM per app over time | P0 |
| Trend Analysis | "VS Code memory usage up 20% this month" | P0 |
| Comparison View | Compare app performance across versions | P1 |
| Resource Budgets | Set expected usage, alert on deviation | P2 |
| App Health Score | Composite score based on resource behavior | P2 |

---

#### 3.3 Customizable Dashboard

| Feature | Description | Priority |
|---------|-------------|----------|
| Widget System | Drag-and-drop widget placement | P0 |
| Widget Types | Gauge, Graph, Number, List, Mini-chart | P0 |
| Custom Layouts | Save multiple dashboard layouts | P0 |
| Widget Sizing | Resize widgets freely | P1 |
| Widget Settings | Configure each widget individually | P0 |
| Layout Presets | Gaming, Development, Server, Minimal | P1 |

**Available Widgets (v3):**
- CPU Gauge
- RAM Gauge
- CPU Per-Core Bars
- Network Speed Graph
- Disk Activity Graph
- Top Processes List
- Temperature Display
- Alerts Feed
- Quick Stats Card
- Custom Metric Graph

---

#### 3.4 Comprehensive Reporting

| Feature | Description | Priority |
|---------|-------------|----------|
| Weekly Summary | Auto-generated weekly report | P0 |
| Monthly Report | Detailed monthly analysis | P0 |
| PDF Export | Professional formatted reports | P1 |
| Email Reports | Scheduled email delivery | P2 |
| Custom Report Builder | Choose metrics and date range | P1 |

**Report Contents:**
- Peak usage times
- Most resource-intensive applications
- System health trends
- Alert summary
- Recommendations

---

#### 3.5 Latency Monitoring

| Feature | Description | Priority |
|---------|-------------|----------|
| Ping Monitoring | Continuous ping to configured hosts | P0 |
| Latency History | Graph latency over time | P0 |
| Packet Loss Tracking | Detect connection instability | P0 |
| Custom Endpoints | Add any IP/hostname to monitor | P0 |
| ISP Detection | Identify if issues are ISP-related | P2 |
| Game Server Pings | Preset popular game servers | P2 |

**Default Monitored Endpoints:**
- 8.8.8.8 (Google DNS)
- 1.1.1.1 (Cloudflare DNS)
- User's default gateway

---

#### 3.6 Recommendations Engine

| Feature | Description | Priority |
|---------|-------------|----------|
| Performance Tips | Context-aware suggestions | P0 |
| Resource Hogs Identification | "Disable X to save Y resources" | P0 |
| Startup Optimization | Prioritized list of what to disable | P0 |
| Thermal Recommendations | "Your CPU runs hot, consider cleaning" | P1 |
| Upgrade Suggestions | "RAM often at 90%+, consider upgrade" | P2 |

---

## Non-Functional Requirements

### Performance

| Metric | Target |
|--------|--------|
| CPU Usage (idle, 1s refresh) | < 0.5% |
| CPU Usage (active monitoring) | < 1% |
| RAM Usage | < 100 MB |
| Startup Time | < 2 seconds |
| Database Size (90 days) | < 500 MB |

### Security & Privacy

| Requirement | Implementation |
|-------------|----------------|
| No Telemetry | Zero data sent externally |
| Local Storage Only | All data in local SQLite |
| No Internet Required | Fully offline capable |
| Secure Updates | Signed update packages |

### Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Keyboard Navigation | Full keyboard support |
| Screen Reader Support | Proper ARIA labels / UI Automation |
| High Contrast Mode | Support Windows high contrast |
| Scalable UI | Respect Windows DPI settings |

---

## File Structure

```
NxrthMon/
├── NxrthMon.exe                    # Main application
├── NxrthMon.Service.exe            # Background data collection service
├── data/
│   └── nxrthmon.db                 # SQLite database
├── config/
│   └── settings.json               # User preferences
├── logs/
│   └── nxrthmon.log                # Application logs
└── resources/
    └── icons/                      # Tray icons and assets
```

---

## Installation & Distribution

| Method | Priority |
|--------|----------|
| MSI Installer | P0 |
| Portable ZIP | P1 |
| Microsoft Store | P2 |
| Winget | P2 |

---

## Version Summary

| Version | Focus | Key Features |
|---------|-------|--------------|
| **v1.0 (MVP)** | Core Monitoring | Real-time dashboard, 48h history, basic alerts, tray integration |
| **v2.0** | Enhanced Intelligence | Temperature, per-app network, startup analysis, export |
| **v3.0** | Power User | Custom dashboards, advanced alerts, reports, recommendations |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| User Retention (30-day) | > 40% |
| Crash Rate | < 0.1% sessions |
| Support Tickets per User | < 0.05 |
| Average Rating | > 4.5 stars |

---

## Appendix A: Competitive Analysis

| Feature | Task Manager | Resource Monitor | NxrthMon v1 | NxrthMon v3 |
|---------|--------------|------------------|-------------|-------------|
| Real-time metrics | Yes | Yes | Yes | Yes |
| Historical data | No | No | 48 hours | 90 days |
| Alerts | No | No | Basic | Advanced |
| Temperature | No | No | No | Yes |
| Per-app network history | No | No | No | Yes |
| Customizable UI | No | No | Limited | Full |
| Export data | No | No | Yes | Yes |
| Startup analysis | Basic | No | No | Yes |
| Reports | No | No | No | Yes |

---

## Appendix B: Licensing Considerations

**Third-Party Libraries:**
- LibreHardwareMonitor: MPL 2.0 (compatible with commercial use)
- SQLite: Public Domain
- LiveCharts2: MIT License

---

*Document Version: 1.0*
*Author: NxrthStack Product Team*
