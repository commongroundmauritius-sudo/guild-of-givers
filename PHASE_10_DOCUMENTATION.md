# Phase 10: Automation, Engagement Workflows & Intelligent Operations

## Overview

Phase 10 evolved CommonGround from a supporter intelligence infrastructure into a proactive engagement and operational platform. This was achieved by implementing a lightweight, event-driven automation engine, a channel-agnostic communication dispatcher, and enhanced CRM operational tools.

## 1. Automation Architecture

- **Location:** `src/lib/automation/`
- **Tables:** `automation_rules`, `automation_executions`, `automation_logs`
- **Services:**
  - `automationService`: Orchestrates trigger matching and execution.
  - `triggerHandler`: Matches payloads against rule configurations (Activity, Event, Threshold).
  - `actionExecutor`: Executes modular actions (Send Email, Create Notification, Update Lifecycle, Create Task).
- **Extensibility:** New trigger types can be added to `triggerHandler` and new action types to `actionExecutor`.

## 2. Communication Abstraction

- **Location:** `src/lib/communication/dispatcher.ts`
- **Dispatcher:** Provides a `dispatch` method that handles routing messages across multiple channels (Email, In-App, and prepared for SMS/WhatsApp).
- **Integration:** Hooks directly into the existing `engagementService` and `email_queue`.

## 3. Supporter Engagement Scoring

- **Heuristic:** Transparent scoring based on Activity Frequency (40%), Successful Payments (30%), and Active Subscriptions (30%).
- **Levels:** Low, Medium, High, Elite.
- **Implementation:** PostgreSQL function `calculate_supporter_engagement_scores()` persists snapshots to `supporter_engagement_scores`.
- **Visualization:** `EngagementBadge.tsx` provides a tooltip with a detailed score breakdown.

## 4. Smart Segmentation Evolution

- **Service:** `segmentation-service.ts`
- **Logic:** Dynamic JSON-to-SQL filter conversion. Supporters are segmented in real-time based on their profiles and activity.
- **UI:** `SegmentationView.tsx` allows organizations to view and interact with their supporter segments.

## 5. Operational Tooling (CRM Tasks)

- **Table:** `crm_tasks`
- **Feature:** Internal task management for organization staff to track follow-ups (e.g., failed payment recovery, donor outreach).
- **UI:** `TaskModule.tsx` integrated into the CRM dashboard.

## 6. Event-Driven Workflows

- **Location:** `workflow-service.ts`
- **Examples:** Welcome Series and Payment Recovery flows.
- **Mechanism:** Workflows can be single-step or multi-step (using `automation_executions` for scheduling follow-ups).

## Integration Points

- **Activities:** `activityService.logEvent` now automatically triggers the automation engine.
- **Payments:** `subscriptionEngine` triggers automation for failures, cancellations, and returns.
- **Dashboards:** The CRM module now features a Tabbed interface separating Intelligence, Segments, and Tasks.

## Future Considerations

- **Recommendation Engine:** Foundation laid via `supporter_interests` table.
- **Predictive Intelligence:** Historical data in `automation_logs` and `engagement_scores` provides the dataset for future AI/ML integration.
- **Channels:** `SmsChannel` and `WhatsAppChannel` stubs in dispatcher are ready for provider integration.
