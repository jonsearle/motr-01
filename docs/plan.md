# Spannr Drop-Off Prototype 02 - Implementation Plan

## 1. Project + Data Foundations ✅ Complete

Entities: booking_settings, bookings, garage_site_content

Supabase schema, helpers, and sanity test fully operational.

**Note:** Booking entity includes optional `time` field (expected drop-off time) - schema/types updated.

Prototype note:

Security, access control, and advanced validation are not included at this stage.

---

## 2. Admin Shell & Navigation ✅ Desktop-only version complete

Top banner (Spannr logo + "Your Garage")

Left-hand nav: Your Diary / Your Website / Settings

Routing: /admin/diary, /admin/website, /admin/settings

Placeholder pages created

(Responsiveness intentionally skipped)

---

## 3. Online Booking Settings  ✅ Desktop version complete

Implements the configuration logic used by both Admin and Public site.

### 3.1 Notification Details

Fields: notification_name, notification_email

Validate email format (basic only)

### 3.2 Business Hours

Per-day open/close time

Drop-off window (from/to)

Validate window falls within business hours

### 3.3 Advance Booking Notice

Minimum number of working days required before a booking can be made (0 = same-day allowed).

**Configuration Logic:**
- The current day is counted as day 0
- The system adds X working days, skipping weekends and any days when the garage is closed
- Bookings become available from the start of the drop-off window (or business opening time if none) on the first eligible working day
- If that target day is closed, the next open day becomes available instead

**Data Model:**
- `lead_time_days` → integer (default 0)
- `lead_time_basis` → 'working_days' (default)
- `timezone` → 'Europe/London' (default)

**Admin Override:**
- Bookings created through the Admin Portal are not restricted by advance booking notice or daily booking limit
- These rules apply only to customer-facing bookings created via the public website

### 3.4 Daily Booking Limit

Maximum bookings per day; closes day once reached

### 3.5 Save / Load Logic

Load settings from Supabase

Validate + upsert

Confirmation toast / error message

Prototype note: only single-user setup required; no multi-garage logic.

---

## 4. Edit Your Website (CMS) ✅ Desktop version complete

Simplified CMS for garage content management.

### 4.1 Core Content

#### 4.1.1 Business Info (name, tagline, address, email, phone)

#### 4.1.2 About Us text + header image placeholder

**Note:** Header image uses placeholder (provided by user), not stored in DB.

#### 4.1.3 "How to Find Us" (address + "Get Directions" button)

#### 4.1.4 Built by Spannr footer

#### 4.1.5 Wire to Supabase

### 4.2 Services & Reviews

#### 4.2.1 Add/delete services (max 9)

#### 4.2.2 Add/delete reviews (max 3 with name, text, stars)

#### 4.2.3 Google reviews link (optional)

#### 4.2.4 Persist to Supabase

Prototype note: image uploads use placeholder URL (provided by user).

---

## 5. Public Garage Website (Customer-Facing)

Simple responsive site demonstrating customer experience.

### 5.1 Reads live content + booking settings from Supabase

### 5.2 Displays: header, reviews, services, about, find us, contact, opening hours, footer

### 5.3 Reactive behaviour

Open: "We're open now." → Primary CTA: Call Us

Closed: "Sorry, we're closed right now." → Primary CTA: Book Online

### 5.4 Sticky navigation for scrolling

### 5.5 Mobile-first layout (minimal, prototype-grade)

Prototype note: SEO, accessibility, and browser testing deferred.

---

## 6. Online Booking Flow (Customer Journey)

Implements core end-to-end customer booking.

### 6.1 Entry: via Book Online button or stand-alone booking link

### 6.2 Steps

Choose appointment type (MOT / Interim Service / Full Service / Request a Specific Job) - **hardcoded options**

If custom → describe issue

Pick available date (calendar honours daily limit & closed days & advance notice period - X working days, excluding weekends and closed days) - **all three determine availability**

Enter name + mobile

Enter vehicle registration (optional)

Enter expected drop-off time (optional) - **new field**

Confirmation page (shows summary)

### 6.3 Output

Save to bookings table

Trigger email to garage and optional SMS/email to customer

Prototype note: SMS/email may be stubbed or manual simulation.

---

## 7. Your Diary (Digital Diary View)

Garage's internal view of all bookings.

### 7.1 Month View

Past / Closed / Open states

Show # of bookings per day and capacity (e.g. "3 of 5 booked")

Today highlighted

Navigate between months (including historical)

### 7.2 Day View

List bookings with: time (expected drop-off), name, phone, vehicle reg, notes

Create / Edit / Delete actions

Close day view returns to same position

### 7.3 Create Booking

Access from main or day view

Pre-fill date if coming from day view

Fields: date, time (optional), name, phone, vehicle reg, description, appointment type

Actions: Save (updates DB + refreshes calendar) / Cancel

### 7.4 Edit Booking

Opens full-screen form

Update Booking / Cancel

Calendar refreshes after save

### 7.5 Behaviour

Diary always returns to last viewed month/day

Auto-refresh after any CRUD action

Prototype note: single-garage only; no multi-user locking or concurrency checks.

---

## 8. Notifications & Comms

### 8.1 Email confirmation to garage + customer (optional)

### 8.2 Optional SMS confirmation (simulated OK)

### 8.3 Basic error logging only; no retry service

---

## 9. Final Pass / Polish

### 9.1 Light mobile UI review (admin + public)

### 9.2 Copy, tone, and visual consistency

### 9.3 Demo data (sample garage + bookings)

### 9.4 End-to-end walkthrough ready for presentation

---

## 🧭 Prototype Parameters Recap

This plan intentionally omits:

Authentication / payments / role management

Production-grade security and error handling

Performance optimisation

These will be added after the prototype validates product fit.

---

## Implementation Decisions Made

- **Booking time field:** Optional `time` field added to bookings (expected drop-off time)
- **Header image:** Placeholder approach (not stored in DB, provided by user)
- **Appointment types:** Hardcoded (MOT, Interim Service, Full Service, Request a Specific Job)
- **Unavailable dates:** All of the above (closed days, booking limit, advance notice period - working days calculation)
- **Advance booking notice:** Working days (not hours) - skips weekends and closed days
- **Navigation label:** "Settings" (not "Online Booking Settings")

**Note:** Requirements and plan may be refined as we build. Document decisions as we make them.

