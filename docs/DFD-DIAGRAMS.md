# Data Flow Diagrams (DFD) Specification
### Public Grievance Redressal and Tracking System

This document contains the Data Flow Diagrams (DFD) across all architectural levels: **Level 0 (Context Diagram)**, **Level 1 (System Decomposition)**, and **Level 2 (Detailed Process Explosions)**.

Rendered using standard Mermaid notation. You can view these directly in GitHub/Markdown readers or export them via [mermaid.live](https://mermaid.live).

---

## 1. DFD Level 0 — Context Diagram

The Context Diagram defines the system boundary, external entities interacting with the application, and the primary high-level data inflows and outflows.

```mermaid
flowchart TD
    %% External Entities
    E1["Citizen"]
    E2["Department Officer"]
    E3["Municipal Administrator"]
    E4["Scheduler (Cron Service)"]

    %% Central Process 0
    P0(("0.0<br/>Public Grievance<br/>Redressal & Tracking<br/>System"))

    %% Citizen Data Flows
    E1 -->|"Registration Details & Credentials"| P0
    E1 -->|"Grievance Details & Photo Attachments"| P0
    E1 -->|"Tracking Query (Tracking ID)"| P0
    E1 -->|"Feedback Rating (1-5 Stars) & Reopen Request"| P0
    P0 -->|"Auth Token & Profile Info"| E1
    P0 -->|"Generated Tracking ID (GRV-YYYY-XXXXXX)"| E1
    P0 -->|"Grievance Status Timeline & Resolution Details"| E1
    P0 -->|"Live Status Toast Notifications"| E1

    %% Officer Data Flows
    E2 -->|"Officer Credentials"| P0
    E2 -->|"Status Update & Mandatory Remarks"| P0
    E2 -->|"Internal Staff Notes & Comments"| P0
    P0 -->|"Auth Token & Department Scope"| E2
    P0 -->|"Department Complaints Queue & Escalated Alerts"| E2
    P0 -->|"Attachment Image Stream & Case History"| E2

    %% Admin Data Flows
    E3 -->|"Admin Credentials"| P0
    E3 -->|"Department Configurations & Category Mappings"| P0
    E3 -->|"Officer Account Provisioning & Activation"| P0
    E3 -->|"Grievance Reassignment Directives"| P0
    E3 -->|"Manual Escalation Trigger"| P0
    P0 -->|"System-Wide Analytics & Resolution Metrics"| E3
    P0 -->|"Immutable Audit Trail (Status History)"| E3
    P0 -->|"Urgent Escalation Broadcasts"| E3

    %% Scheduler Flows
    E4 -->|"Periodic SLA Escalation Trigger (Every 6h)"| P0
    P0 -->|"Escalation Execution Summary & Status"| E4
```

---

## 2. DFD Level 1 — System Decomposition Diagram

Breaks down the central process into the 6 major functional subsystems and details interactions with the primary database stores (**D1 through D7**).

```mermaid
flowchart TB
    %% External Entities
    E1["Citizen"]
    E2["Officer"]
    E3["Admin"]
    E4["Cron Scheduler"]

    %% Level 1 Processes
    P1(("1.0<br/>Authentication<br/>& Access Control"))
    P2(("2.0<br/>Grievance<br/>Lodgment & Routing"))
    P3(("3.0<br/>Officer Triage &<br/>Workflow Update"))
    P4(("4.0<br/>Tracking, Timeline<br/>& Feedback"))
    P5(("5.0<br/>Real-Time Socket<br/>Notification Engine"))
    P6(("6.0<br/>Administration,<br/>Analytics & Escalation"))

    %% Data Stores
    D1[("D1: Users")]
    D2[("D2: Departments")]
    D3[("D3: Grievances")]
    D4[("D4: Status History (Audit)")]
    D5[("D5: Comments & Notes")]
    D6[("D6: Notifications")]
    D7[("D7: Counters")]

    %% Process 1.0 (Auth)
    E1 -->|"Register / Login Credentials"| P1
    E2 -->|"Officer Login"| P1
    E3 -->|"Admin Login"| P1
    P1 <-->|"Verify & Hash Password / Load Role"| D1
    P1 -->|"Issue Signed JWT & Session Data"| E1
    P1 -->|"Issue Signed JWT & Session Data"| E2
    P1 -->|"Issue Signed JWT & Session Data"| E3

    %% Process 2.0 (Filing & Routing)
    E1 -->|"Grievance Form + Files"| P2
    P2 <-->|"Fetch Next Seq No."| D7
    P2 <-->|"Lookup Category Match"| D2
    P2 -->|"Write New Grievance Document"| D3
    P2 -->|"Record Initial 'SUBMITTED' Log"| D4
    P2 -->|"Return Generated Tracking ID"| E1
    P2 -->|"Trigger New Complaint Alert"| P5

    %% Process 3.0 (Officer Triage)
    E2 -->|"Status Transition + Mandatory Remark"| P3
    E2 -->|"Add Public/Internal Comment"| P3
    P3 <-->|"Validate Allowed Transition & State"| D3
    P3 -->|"Update Status & Timestamp"| D3
    P3 -->|"Record Audit Entry"| D4
    P3 -->|"Store Comment Record"| D5
    P3 -->|"Trigger Status Notification Event"| P5
    P3 <-->|"Fetch Attachments & Complaint List"| D3
    P3 -->|"Display Filtered Department Queue"| E2

    %% Process 4.0 (Tracking & Feedback)
    E1 -->|"Lookup Tracking ID"| P4
    E1 -->|"Submit 1-5 Star Rating"| P4
    E1 -->|"Submit Reopen Request"| P4
    P4 <-->|"Fetch Case & Status Timeline"| D3
    P4 <-->|"Fetch Audit Trail"| D4
    P4 <-->|"Fetch Public Comments"| D5
    P4 -->|"Store Rating & Reopened State"| D3
    P4 -->|"Render Timeline & Details"| E1
    P4 -->|"Trigger Reopen Alert"| P5

    %% Process 5.0 (Notifications)
    P5 -->|"Save Notification History"| D6
    P5 -->|"Push Live Toast Event via WebSocket"| E1
    P5 -->|"Push Escalation Alert to Admins"| E3
    E1 <-->|"Fetch Unread & Mark Read"| D6

    %% Process 6.0 (Admin, Analytics & Escalation)
    E3 -->|"Create/Edit Department & Categories"| P6
    E3 -->|"Provision / Activate Officers"| P6
    E3 -->|"Reassign Complaint Dept / Officer"| P6
    E4 -->|"Trigger Auto-Escalation Check"| P6
    P6 <-->|"CRUD Department Taxonomy"| D2
    P6 <-->|"CRUD Officers & Staff Accounts"| D1
    P6 <-->|"Reassign & Mark Escalated"| D3
    P6 -->|"Log Reassignment to Audit"| D4
    P6 <-->|"Aggregate Metrics (Category / Turnaround)"| D3
    P6 -->|"Display Executive Dashboard"| E3
    P6 -->|"Trigger Escalation Broadcast"| P5
```

---

## 3. DFD Level 2 — Detailed Process Explosions

### 3.1 DFD Level 2 for Process 2.0 (Grievance Lodgment & Routing)
Explodes how incoming complaints are validated, sequentially numbered, categorized, and stored.

```mermaid
flowchart TD
    %% Inflow
    E1["Citizen"] -->|"Raw Form Payload & Uploaded Files"| P2_1["2.1 Validate Payload & Attachments"]
    
    %% 2.1 Validation
    P2_1 -->|"File Count > 2, Size > 1MB, or Bad MIME"| ERR1["Reject: 400 UPLOAD_ERROR / VALIDATION_ERROR"]
    P2_1 -->|"Valid Form Data & Image Buffers"| P2_2["2.2 Generate Atomic Tracking ID"]

    %% 2.2 Sequence
    P2_2 <-->|"Atomic $inc: seq in Year Counter"| D7[("D7: Counters")]
    P2_2 -->|"Formatted ID (GRV-YYYY-XXXXXX)"| P2_3["2.3 Resolve Department Routing"]

    %% 2.3 Category Lookup
    P2_3 <-->|"Match category in categoriesHandled"| D2[("D2: Departments")]
    P2_3 -->|"Assigned Department ID"| P2_4["2.4 Assemble & Persist Grievance Document"]

    %% 2.4 Document Storage
    P2_4 -->|"Insert Grievance (Status: SUBMITTED)"| D3[("D3: Grievances")]
    P2_4 -->|"Insert Initial History Log"| D4[("D4: Status History")]
    P2_4 -->|"Emit Event with trackingId"| P5_INT["5.0 Notification Engine"]
    P2_4 -->|"Return 201 Created + trackingId"| E1
```

---

### 3.2 DFD Level 2 for Process 3.0 (Officer Workflow & State Machine)
Explodes how an officer's action is vetted against state machine rules, audited, and logged.

```mermaid
flowchart TD
    E2["Department Officer"] -->|"PATCH /status { newStatus, remark }"| P3_1["3.1 Verify Officer Department Scope"]
    
    %% 3.1 Scope
    P3_1 <-->|"Verify officer.department == grievance.department"| D3[("D3: Grievances")]
    P3_1 -->|"Unauthorized"| ERR2["Reject: 403 FORBIDDEN"]
    P3_1 -->|"Authorized"| P3_2["3.2 Check Allowed State Transition"]

    %% 3.2 State Machine
    P3_2 -->|"Check VALID_TRANSITIONS[currentStatus].includes(newStatus)"| VET{"Valid Transition?"}
    VET -- "No" --> ERR3["Reject: 400 INVALID_TRANSITION"]
    VET -- "Yes" --> P3_3["3.3 Validate Mandatory Remark"]

    %% 3.3 Remark Validation
    P3_3 -->|"Remark Empty or < 5 chars"| ERR4["Reject: 400 VALIDATION_ERROR"]
    P3_3 -->|"Valid Remark"| P3_4["3.4 Commit Status & Generate Audit Entry"]

    %% 3.4 Persistence
    P3_4 -->|"Update status, updatedAt, isEscalated"| D3
    P3_4 -->|"Insert StatusHistory { from, to, remark, changedBy }"| D4[("D4: Status History")]
    P3_4 -->|"Dispatch Notification Event"| P5_INT["5.0 Notification Engine"]
    P3_4 -->|"200 OK + Updated Record"| E2
```

---

### 3.3 DFD Level 2 for Process 6.0 (SLA Monitoring & Escalation)
Explodes how automated cron timers or manual admin triggers detect overdue grievances.

```mermaid
flowchart TD
    E4["Cron Trigger / Admin"] -->|"POST /jobs/escalate + x-cron-secret"| P6_1["6.1 Authenticate Job Secret Header"]
    
    P6_1 -->|"Invalid Secret"| ERR5["Reject: 401 UNAUTHORIZED"]
    P6_1 -->|"Valid Secret"| P6_2["6.2 Query Unresolved Overdue Grievances"]

    %% Query Overdue
    P6_2 <-->|"Find { status: { $nin: ['RESOLVED', 'REJECTED'] }, createdAt: { $lt: Now - 7d }, escalated: false }"| D3[("D3: Grievances")]
    
    P6_2 -->|"List of Overdue Complaints"| P6_3["6.3 Batch Mark Escalated & Record Audit"]
    
    %% Update
    P6_3 -->|"UpdateMany { escalated: true, escalatedAt: Now }"| D3
    P6_3 -->|"Insert StatusHistory { remark: 'Auto-escalated: SLA breach > 7 days' }"| D4[("D4: Status History")]
    P6_3 -->|"Broadcast Escalation Alerts to 'admins' Room"| P5_INT["5.0 Notification Engine"]
    P6_3 -->|"Return { escalatedCount, timestamp }"| E4
```
