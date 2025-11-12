# Spannr Drop-Off Prototype - Product Requirements Document

## Document Purpose

This document defines the functional requirements for the Spannr Drop-Off prototype — a working demonstration of the garage booking and management system.

---

## 1. Prototype Scope & Assumptions

This version of Spannr Drop-Off is a functional prototype designed to demonstrate core value and product flow — not a production system.

Its purpose is to validate the user experience, data model, and core workflows for independent garages managing online bookings.

### ✅ In Scope for Prototype

- Full end-to-end flow from configuration → booking → diary → website display
- Live database connection (Supabase)
- UI consistency using Tailwind
- Persistent data (settings, bookings, content)
- Reactive website states (open/closed)
- Email/SMS triggers simulated or partially functional (optional)

### ❌ Out of Scope (for Prototype Phase)

These items will be addressed in future production releases once the prototype is validated:

- User authentication / multi-user login
- Payment integration
- Access permissions or roles
- Advanced error handling or audit logging
- Data validation beyond basic sanity checks
- Security hardening (RLS, encryption, auth guards)
- Full mobile optimisation (except essential responsiveness)
- Production deployment scaling or cost optimisation

### 🎯 Prototype Goal

To produce a working demo that:

- Shows the complete user journey (from website visit to booking confirmation).
- Allows an investor, user, or potential partner to grasp the concept immediately.
- Proves technical feasibility of the booking logic and content sync.

---

## 2. Overview

The Spannr platform enables independent garages to manage their online presence, bookings, and schedules through a simple, mobile-friendly system.

It is composed of two main areas:

- **Garage Admin Portal** — where the garage owner manages content, booking settings, and daily operations.
- **Customer-Facing Website** — where customers can view information and make bookings.

The Admin Portal consists of three sub-sections:

- **Online Booking Settings** — configuration of operational hours, limits, and notifications.
- **Edit Your Website** — management of public-facing content and presentation.
- **Your Diary** — management of daily bookings and viewing the schedule.

---

## 3. Online Booking Settings

Defines the options a garage can configure to control how bookings are accepted and managed.

### 3.1 Notification Details

- **Notification Name:** The name displayed on booking confirmation and alert emails.
- **Notification Email:** Email address that receives booking alerts when customers book online.
- **Validation:** Must be a valid email address.
- **Requirement:** Mandatory.

### 3.2 Business Hours

- **Business Open Time:** Start of daily operating hours.
- **Business Close Time:** End of daily operating hours.

Used for displaying opening hours, determining open/closed state, and validating booking availability.

### 3.3 Advance Booking Notice

Defines the minimum number of working days required before a customer can make a booking.

**Purpose:** To prevent last-minute bookings and allow garages time to plan workloads.

**Configuration Logic:**

- The current day is counted as day 0.
- The system adds X working days, skipping weekends and any days when the garage is closed.
- Bookings become available from the start of the drop-off window (or, if none is set, from the business opening time) on the first eligible working day.
- If that target day is closed, the next open day becomes available instead.

**Example Behaviour:**

- If the notice is set to 2 working days and today is Wednesday, the first available date will be Friday, regardless of the current time.
- If today is Friday, the first available date will be Tuesday (skipping the weekend).

**Admin Override:**

- Bookings created through the Admin Portal are not restricted by the advance booking notice or daily booking limit.
- Admin users can create, edit, or delete any booking regardless of date, time, or capacity limits.
- These rules apply only to customer-facing bookings created via the public website.

**Data Model:**

- `lead_time_days` → integer (default 0)
- `lead_time_basis` → enum (default 'working_days')
- `timezone` → 'Europe/London'

**Validation Rules:**

- Must be an integer ≥ 0
- When generating available booking dates (public bookings only), exclude any day that:
  - Falls before the minimum working-day offset
  - Is marked as closed
  - Exceeds the daily booking limit

**Backend Behaviour Summary:**

- Compute the earliest bookable date using `addWorkingDays(baseDate, n, openDays)`
- Derive `unlock_datetime` = start of drop-off window (or opening time if none) on the first eligible day
- Filter all public booking slots so that `slot.start >= unlock_datetime`
- Skip all these filters if the request originates from the Admin Portal

**Implementation Notes:**

- The advance-booking and capacity limits apply only to public bookings
- Admin bookings can override all restrictions for testing, walk-ins, or late adjustments
- Weekends and closed days are excluded; holidays are not considered in this prototype
- No UI changes are required; unavailable dates are filtered in backend logic

### 3.4 Daily Booking Limit

Maximum number of bookings per day.

Once reached, the day becomes unavailable for further bookings.

### 3.5 Drop-Off Time Window

Defines when vehicles may be dropped off.

Drop-Off From / To Time must fall within business hours.

---

## 4. Edit Your Website

Allows garage owners to manage public-facing website content through a simple CMS interface.

### 4.1 Business Information

- Business Name
- Tagline / One-Line Description
- Main Image Upload (header image - placeholder for prototype)
- About Us Description

### 4.2 Contact Details

- Address Fields (street, town/city, county)
- Postcode
- Phone Number
- Business Email Address

### 4.3 Services Section

Add up to nine services, each with:

- Service Name
- Service Description

Add/Delete functionality

### 4.4 Customer Reviews

Add up to three custom reviews:

- Customer Name
- Review Text
- Star Rating (1–5)

**Google Reviews Link:** Optional link to external reviews.

### 4.5 Purpose

Simplifies website content management — usually set once and rarely updated.

---

## 5. Your Diary (Digital Diary View)

The Your Diary section is where the garage views and manages bookings.

It presents a full month-view calendar and allows creation, editing, and deletion of bookings.

### 5.1 Calendar Overview

- Displays one month at a time with navigation between months.
- Users can navigate forwards and backwards, including historical months.
- Today is always highlighted.

Each day in the calendar shows one of three states:

- **Past Days:** before today; not interactive.
- **Closed Days:** when the garage is shut; greyed out.
- **Open Days:** when the garage is open; interactive.

Each Open Day shows:

- Number of bookings already made.
- Daily booking capacity status (e.g., 3 of 5 booked).

### 5.2 Day View (Click to Open)

Clicking on a day expands a detailed Day View panel or overlay showing all bookings for that day.

Each booking includes:

- Time (optional for drop-off reference - expected drop-off time)
- Customer Name
- Telephone Number
- Vehicle Registration
- Description / Notes (free text)

From this view, users can:

- Create Booking (opens Create Booking page)
- Edit Booking (opens Edit Booking page)
- Delete Booking (removes it from the system)
- Close Day View to return to month view

### 5.3 Create Booking Flow

Accessed from Create Booking button either on the main calendar or within a specific day.

If opened from a specific day, that date is pre-filled (but editable).

**Fields:**

- Date
- Time (optional - expected drop-off time)
- Customer Name
- Telephone Number
- Vehicle Registration
- Description / Notes
- Appointment Type

**Actions:**

- **Save Booking** — saves record, updates calendar, and returns to Your Diary homepage.
- **Cancel** — discards input and returns to previous view.

### 5.4 Edit Booking Flow

Accessed by clicking Edit on an existing booking.

Opens a full-screen edit form pre-filled with booking details.

**Actions:**

- **Update Booking** — saves changes and returns to Your Diary page.
- **Cancel** — discards edits.

### 5.5 Key Interaction Summary

- Create Booking buttons exist on both the Diary homepage and within individual days.
- The Diary always returns the user to the last viewed position after any action.
- Calendar automatically refreshes after creating, editing, or deleting a booking.

---

## 6. Garage Website (Public Front End)

Responsive, mobile-friendly website displaying garage information and reacting dynamically to business hours.

### 6.1 Structure

- Header (business name, tagline, contact info)
- What Our Customers Say (three reviews + Google link)
- Our Services (up to nine)
- About Us (image + description)
- How to Find Us (address + Get Directions)
- Contact Us (email + phone)
- Opening Hours
- Footer: "Built by Spannr"

### 6.2 Reactive Behaviour

**Open State:**

- Message: "We're open now."
- Primary CTA: Call Us
- Secondary CTA: Book Online

**Closed State:**

- Message: "Sorry, we're closed right now."
- Primary CTA: Book Online
- Phone number remains visible.

### 6.3 Navigation

Sticky navigation bar for easy access to key sections.

---

## 7. Online Booking Flow (Customer Journey)

### 7.1 Entry Points

- From the Book Online button on the garage website.
- From a standalone booking link (e.g., Google appointment link).

### 7.2 Steps

1. **Choose Appointment Type:** MOT, Interim Service, Full Service, or Request a Specific Job.
2. **Describe Issue** (if specific job): text box + Continue.
3. **Select Date:** calendar view with three states (past / unavailable / available).
   - Unavailable includes: closed days, days at booking limit, days that fall before the required advance booking period (X working days), calculated from today (excluding weekends and closed days).
   - Note: Admin bookings ignore these restrictions.
4. **Enter Details:** Name + Mobile Number + Vehicle Registration (optional) + Expected Drop-off Time (optional).
5. **Confirmation Page:** shows booking summary, triggers SMS to customer + email to garage.

### 7.3 Mobile-First Design

Fully responsive and optimised for touch interaction and small screens.

---

## Implementation Notes

- All data model details are defined in `/docs/spanner-dropoff-notes.md` (source of truth).
- See `/docs/plan.md` for implementation plan and status.
- Requirements and plan may be refined as we build.

