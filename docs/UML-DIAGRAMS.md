# UML Diagrams Specification
### Public Grievance Redressal and Tracking System

This document contains the complete collection of Unified Modeling Language (UML) diagrams for the system, rendered using Mermaid. You can view these directly in GitHub, Markdown viewers with Mermaid support, or paste the code blocks into [mermaid.live](https://mermaid.live) to export high-resolution PNG/SVG assets.

---

## 1. Use Case Diagram

Visualizes the interactions between the system actors (**Citizen**, **Officer**, **Admin**, and **System Cron**) and system use cases.

```mermaid
flowchart LR
    %% Actors
    citizen["Citizen"]
    officer["Department Officer"]
    admin["Municipal Admin"]
    cron["System Scheduler (Cron)"]

    %% Citizen Use Cases
    subgraph Citizen_Boundary["Citizen Operations"]
        uc_reg(["Register Citizen Account"])
        uc_login(["Authenticate / Login"])
        uc_file(["File Grievance with Attachments"])
        uc_track(["Track Grievance by ID"])
        uc_history(["View Filed Grievances & Timeline"])
        uc_rate(["Submit Feedback Rating (1-5 Stars)"])
        uc_reopen(["Reopen Resolved Grievance (Once)"])
        uc_notif_c(["Receive Live Status Notifications"])
    end

    %% Officer Use Cases
    subgraph Officer_Boundary["Department Officer Operations"]
        uc_queue(["View Department Complaints Queue"])
        uc_filter_o(["Filter by Status / Priority / Escalation"])
        uc_update_status(["Update Status (Workflow State Machine)"])
        uc_remark(["Submit Mandatory Status Remark"])
        uc_internal_note(["Add Internal Department Note"])
        uc_download_att(["Stream / View Grievance Attachments"])
    end

    %% Admin Use Cases
    subgraph Admin_Boundary["Administrative Operations"]
        uc_manage_dept(["Manage Departments & Categories"])
        uc_manage_users(["Provision Officers & Activate/Deactivate Users"])
        uc_reassign(["Reassign Grievance to Dept / Officer"])
        uc_analytics(["View Analytics & Resolution Velocity Charts"])
        uc_audit(["Inspect Immutable System Audit Log"])
        uc_trigger_esc(["Trigger Manual Escalation Job"])
        uc_notif_a(["Receive Escalation Broadcasts"])
    end

    %% System Automations
    subgraph System_Boundary["Automated Background Services"]
        uc_cron_esc(["Auto-Escalate Overdue Complaints (>7 Days)"])
        uc_counter(["Generate Sequential Tracking ID (GRV-YYYY-XXXXXX)"])
    end

    %% Citizen Associations
    citizen --> uc_reg
    citizen --> uc_login
    citizen --> uc_file
    citizen --> uc_track
    citizen --> uc_history
    citizen --> uc_rate
    citizen --> uc_reopen
    citizen --> uc_notif_c

    %% Officer Associations
    officer --> uc_login
    officer --> uc_queue
    officer --> uc_filter_o
    officer --> uc_update_status
    officer --> uc_remark
    officer --> uc_internal_note
    officer --> uc_download_att

    %% Admin Associations
    admin --> uc_login
    admin --> uc_manage_dept
    admin --> uc_manage_users
    admin --> uc_reassign
    admin --> uc_analytics
    admin --> uc_audit
    admin --> uc_trigger_esc
    admin --> uc_notif_a

    %% Cron Associations
    cron --> uc_cron_esc

    %% Dependencies
    uc_file -.->|include| uc_counter
    uc_update_status -.->|include| uc_remark
    uc_cron_esc -.->|trigger| uc_notif_a
```

---

## 2. Class Diagram

Defines the structure of the domain models, attributes, methods, and relationships implemented in MongoDB via Mongoose.

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String name
        +String email
        +String passwordHash
        +String role
        +ObjectId department
        +String phone
        +Boolean isActive
        +Date createdAt
        +Date updatedAt
        +comparePassword(candidatePassword) Boolean
        +generateAuthToken() String
    }

    class Department {
        +ObjectId _id
        +String name
        +String description
        +Array~String~ categoriesHandled
        +Boolean isActive
        +Date createdAt
        +Date updatedAt
    }

    class Grievance {
        +ObjectId _id
        +String trackingId
        +String title
        +String description
        +String category
        +ObjectId department
        +String priority
        +String status
        +ObjectId citizen
        +ObjectId assignedOfficer
        +Array~Attachment~ attachments
        +Boolean escalated
        +Date escalatedAt
        +Object feedback
        +Boolean reopened
        +Date reopenedAt
        +Date createdAt
        +Date updatedAt
        +isTransitionAllowed(newStatus) Boolean
    }

    class Attachment {
        +String filename
        +Buffer data
        +String contentType
        +Number size
    }

    class StatusHistory {
        +ObjectId _id
        +ObjectId grievance
        +String fromStatus
        +String toStatus
        +ObjectId changedBy
        +String remark
        +Date timestamp
    }

    class Comment {
        +ObjectId _id
        +ObjectId grievance
        +ObjectId user
        +String text
        +Boolean isInternal
        +Date createdAt
    }

    class Notification {
        +ObjectId _id
        +ObjectId user
        +ObjectId grievance
        +String message
        +String type
        +Boolean isRead
        +Date createdAt
    }

    class Counter {
        +ObjectId _id
        +String _id_name
        +Number seq
        +getNextSequence(name) Number
    }

    %% Relationships
    User "1" --> "0..1" Department : belongs to
    Grievance "1" --> "1" Department : routed to
    Grievance "1" --> "1" User : filed by (Citizen)
    Grievance "1" --> "0..1" User : assigned to (Officer)
    Grievance "1" *-- "0..2" Attachment : contains
    Grievance "1" <-- "*" StatusHistory : tracks audit
    Grievance "1" <-- "*" Comment : contains discussions
    Grievance "1" <-- "*" Notification : triggers alerts
    User "1" <-- "*" Notification : receives
    User "1" <-- "*" StatusHistory : changed by
    User "1" <-- "*" Comment : authored by
    Grievance ..> Counter : uses for trackingId
```

---

## 3. State Machine Diagram (Grievance Lifecycle)

Depicts all legitimate status states and transition guards defined in `VALID_TRANSITIONS`.

```mermaid
stateDiagram-v2
    [*] --> SUBMITTED : Citizen files complaint

    SUBMITTED --> UNDER_REVIEW : Officer picks up case
    
    UNDER_REVIEW --> IN_PROGRESS : Investigation / field work started
    UNDER_REVIEW --> REJECTED : Out of jurisdiction / Invalid complaint (with remark)

    IN_PROGRESS --> RESOLVED : Field repairs complete (with resolution remark)

    RESOLVED --> REOPENED : Citizen unsatisfied (allowed once within window)
    REJECTED --> REOPENED : Citizen provides fresh clarification (allowed once)

    REOPENED --> UNDER_REVIEW : Officer re-assesses case

    RESOLVED --> [*] : Citizen rates 1-5 stars & Case closes
    REJECTED --> [*] : Case permanently closed
```

---

## 4. Sequence Diagram: Filing a Grievance

Shows the end-to-end execution flow when a citizen files a new complaint with file attachments.

```mermaid
sequenceDiagram
    autonumber
    actor Citizen
    participant Client as Desktop / React UI
    participant API as Express Router & Upload
    participant Auth as Auth Middleware
    participant Svc as Grievance Controller
    participant Counter as Counter Model
    participant DB as MongoDB (Grievances)
    participant Socket as Socket.IO Hub

    Citizen->>Client: Fills form, attaches image (PNG/JPG <= 1MB) & clicks Submit
    Client->>API: POST /api/v1/grievances (multipart/form-data + JWT)
    API->>Auth: Verify JWT & check user.isActive
    Auth-->>API: Authorized (req.user = Citizen)
    API->>API: Multer validates file types and <= 1MB limits
    API->>Svc: createGrievance(req.body, req.files)
    Svc->>DB: Query Department matching category
    DB-->>Svc: Matched Department
    Svc->>Counter: findOneAndUpdate({ _id: 'grievance_YYYY' }, { $inc: { seq: 1 } })
    Counter-->>Svc: Sequential Sequence Number (e.g., 18)
    Svc->>Svc: Format trackingId "GRV-2026-000018"
    Svc->>DB: Save Grievance (attachments as Buffers) + Initial StatusHistory (SUBMITTED)
    DB-->>Svc: Created Grievance Document
    Svc->>Socket: Emit 'new-grievance' to department room & admins
    Svc-->>Client: 201 Created (success: true, trackingId: "GRV-2026-000018")
    Client-->>Citizen: Display Success Modal with copyable tracking ID
```

---

## 5. Sequence Diagram: Officer Status Update & Live Notification

Shows how an officer updates a status, writes to the audit log, and broadcasts a real-time event.

```mermaid
sequenceDiagram
    autonumber
    actor Officer
    participant UI as Officer Dashboard
    participant API as Express API
    participant Ctrl as Grievance Controller
    participant DB as MongoDB
    participant Socket as Socket.IO Server
    participant CitizenUI as Citizen Desktop Window

    Officer->>UI: Selects "IN_PROGRESS" from allowed transitions & writes mandatory remark
    UI->>API: PATCH /api/v1/grievances/:id/status { status, remark }
    API->>Ctrl: updateStatus(req.params.id, req.body)
    Ctrl->>DB: Fetch Grievance
    DB-->>Ctrl: Grievance document
    Ctrl->>Ctrl: Validate status transition against VALID_TRANSITIONS
    Ctrl->>DB: Update status to "IN_PROGRESS"
    Ctrl->>DB: Create StatusHistory entry (fromStatus, toStatus, remark, changedBy)
    Ctrl->>DB: Create Notification record (user: citizenId, message, type)
    DB-->>Ctrl: Saved
    Ctrl->>Socket: io.to("user:" + citizenId).emit("status-update", data)
    Socket-->>CitizenUI: WebSocket event delivered in real-time
    CitizenUI->>CitizenUI: Show live Toast notification & increment Notification Bell badge
    Ctrl-->>UI: 200 OK (updated grievance & status history)
    UI-->>Officer: Update table & timeline view
```

---

## 6. Entity-Relationship (ER) Diagram

Represents the physical relational schema and database foreign key references.

```mermaid
erDiagram
    USERS ||--o{ GRIEVANCES : "files (citizen)"
    USERS ||--o{ GRIEVANCES : "assigned (officer)"
    DEPARTMENTS ||--o{ GRIEVANCES : "routed to"
    DEPARTMENTS ||--o{ USERS : "employs (officer)"
    GRIEVANCES ||--|{ ATTACHMENTS : "contains (embedded)"
    GRIEVANCES ||--o{ STATUS_HISTORIES : "tracks"
    GRIEVANCES ||--o{ COMMENTS : "contains"
    GRIEVANCES ||--o{ NOTIFICATIONS : "generates"
    USERS ||--o{ STATUS_HISTORIES : "creates"
    USERS ||--o{ COMMENTS : "authors"
    USERS ||--o{ NOTIFICATIONS : "receives"

    USERS {
        ObjectId _id PK
        string name
        string email UK
        string passwordHash
        string role
        ObjectId department FK
        string phone
        boolean isActive
        date createdAt
    }

    DEPARTMENTS {
        ObjectId _id PK
        string name UK
        string description
        string_array categoriesHandled
        boolean isActive
        date createdAt
    }

    GRIEVANCES {
        ObjectId _id PK
        string trackingId UK
        string title
        string description
        string category
        ObjectId department FK
        string priority
        string status
        ObjectId citizen FK
        ObjectId assignedOfficer FK
        boolean escalated
        date escalatedAt
        boolean reopened
        date reopenedAt
        object feedback
        date createdAt
    }

    ATTACHMENTS {
        string filename
        buffer data
        string contentType
        number size
    }

    STATUS_HISTORIES {
        ObjectId _id PK
        ObjectId grievance FK
        string fromStatus
        string toStatus
        ObjectId changedBy FK
        string remark
        date timestamp
    }

    COMMENTS {
        ObjectId _id PK
        ObjectId grievance FK
        ObjectId user FK
        string text
        boolean isInternal
        date createdAt
    }

    NOTIFICATIONS {
        ObjectId _id PK
        ObjectId user FK
        ObjectId grievance FK
        string message
        string type
        boolean isRead
        date createdAt
    }

    COUNTERS {
        string _id PK
        number seq
    }
```
