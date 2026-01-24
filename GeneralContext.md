# Odoo Cafe POS – Complete Project Flow (instructions.txt)

This document describes the **end-to-end functional flow** of the Odoo Cafe POS system. It is intended to be used as a **single source of truth** for development, testing, and evaluation. Every module mentioned here is expected to be **fully working and integrated**, not static.

---

## 1. Project Purpose

Odoo Cafe POS is a restaurant Point of Sale system that simulates a **real-world ERP-grade cafe workflow**. The system connects:

* POS Backend (configuration & management)
* POS Frontend (cashier terminal)
* Kitchen Display System (KDS)
* Customer Display
* Optional Mobile / Self Ordering
* Reporting & Analytics

The system must maintain **data consistency, smooth transitions, and real-time updates** across all components.

---

## 2. User Roles

### 2.1 POS User (Admin / Staff)

* Signs up / logs in
* Configures POS (products, payments, tables, displays)
* Opens & closes POS sessions
* Creates and manages orders
* Accepts payments
* Sends orders to kitchen
* Views reports and dashboards

### 2.2 Kitchen User

* Views incoming orders
* Updates food preparation status

### 2.3 Customer (Passive Role)

* Views order and payment details on Customer Display
* Optionally places order via Mobile / QR Ordering

---

## 3. Authentication Flow

1. User lands on **Login / Signup Page**
2. New users register via Signup
3. Existing users log in
4. Successful login redirects to **Main Dashboard**

---

## 4. Dashboard After Login

The dashboard acts as the **central control hub**.

### 4.1 Top Menu

Contains three main modules:

* Orders
* Products
* Reporting

Each menu item expands into a dropdown with sub-features.

### 4.2 POS Terminal Card

Shows:

* POS Terminal name
* Last opened session
* Last closing sale amount

Three-dot menu actions:

* Settings
* Kitchen Display
* Customer Display

---

## 5. POS Settings & Configuration

### 5.1 POS Terminal Configuration

* Create a new POS terminal via **+ New** button
* Popup contains:

  * Terminal Name
  * Save / Discard actions

Each terminal holds its own configuration and sessions.

---

### 5.2 Payment Method Setup

Supported payment methods:

1. **Cash**

   * Appears during checkout if enabled

2. **Digital (Bank / Card)**

   * Generic non-cash payment option

3. **UPI (QR Payment)**

   * Requires UPI ID input
   * QR code is auto-generated at payment time

Enable/disable toggles directly affect POS payment screen.

---

### 5.3 Floor & Table Management

* Create Floor Plans (e.g., Ground Floor)
* Add / remove tables

Each table includes:

* Table Number
* Number of Seats
* Active (toggle)
* Appointment Resource (optional)

Default POS interface loads **5 tables initially**.

Bulk actions:

* Delete
* Duplicate

Tables are selectable during order creation.

---

## 6. Product Management

### 6.1 Product Creation

Each product contains:

**General Info Tab**:

* Product Name
* Category
* Price
* Unit
* Tax
* Description

**Variant Tab**:

* Multiple variants per product
* Variant name & price
* Unit dropdown (KG / Unit / Litre)
* Delete variant option

---

### 6.2 Product Listing

* Shows product list with:

  * Name
  * Category (auto-colored badge)
  * Price

---

### 6.3 Category Management

* Create categories
* Assign color (fixed palette)
* Drag & drop resequence
* Delete category

Category order directly affects POS product filtering.

---

## 7. Orders (Backend View)

### 7.1 Order List View

* Displays all orders
* Multiple selection allowed

Actions:

* Archive (Draft orders only)
* Delete (Draft orders only)

---

### 7.2 Order Detail View

Displays:

* Order Number
* Date
* Session
* Customer
* Status (Draft / Paid)

Toggle views:

1. **Product View**

   * Product
   * Quantity
   * Unit Price
   * Tax
   * Subtotal
   * Total

2. **Extra Info View**

   * Variants / Add-ons

---

## 8. POS Terminal Flow

### 8.1 Open Session

* Clicking **Open Session** launches POS Terminal
* Floor View opens by default

---

### 8.2 POS Terminal Tabs

1. **Table** – Floor & table selection
2. **Register** – Product selection & cart
3. **Orders** – Order overview

Top-right dropdown actions:

* Reload Data
* Go to Backend
* Close Register

---

### 8.3 Table Selection

* Tables shown as cards
* Selecting a table creates/opens an order
* Automatically switches to **Register Tab**

---

### 8.4 Register Screen

Features:

* Products filtered by category
* Quantity increment/decrement
* Right sidebar cart shows:

  * Selected products
  * Total amount
  * Customer field
  * Notes field

Actions:

* Send (to Kitchen)
* Payment

---

## 9. Kitchen Display System (KDS)

### 9.1 Order Flow

* Orders sent from POS using **Send** button
* Each order becomes a kitchen ticket

### 9.2 Kitchen Stages

* To Cook
* Preparing
* Completed

Stage counts update automatically.

### 9.3 Kitchen Actions

* Click ticket → moves to next stage
* Click product → marks item prepared (strike-through)
* Ticket number = Order number

Filters:

* Product
* Category

Search:

* Product name
* Order number

Pagination limits tickets per page.

---

## 10. Payment Flow

### 10.1 Payment Screen

Shows:

* Total amount
* Available payment methods (based on settings)

---

### 10.2 Cash / Digital Payment

* Select payment method
* Click **Validate**
* Confirmation screen appears
* Options:

  * Email receipt
  * Continue

System redirects back to Floor View.

---

### 10.3 UPI QR Payment

* QR generated from configured UPI ID
* Displays:

  * Amount
  * QR Code

Actions:

* Confirmed
* Cancel

On confirmation:

* Payment success screen
* Auto return to Floor View

---

## 11. Customer Display

Access via:

`<database_url>/customer-display`

Features:

* Left panel: fixed message
* Right panel: dynamic order view
* Displays:

  * Products
  * Images
  * Prices
  * Taxes
  * Grand Total

Updates in real-time as cashier acts.

---

## 12. Mobile / Self Ordering (Optional)

### 12.1 Enable Mobile Ordering

Two modes:

1. **Online Ordering**

   * Customers can place orders
   * Token-based URL
   * Example: `/s/unique_token`

2. **QR Menu Only**

   * Digital menu view
   * No ordering allowed

---

### 12.2 QR Generation

* Auto-generate QR per table
* Each QR maps to a unique token
* QR PDF download supported

---

### 12.3 Mobile Flow

* Splash screen with background
* Auto-scroll menu
* Table-aware ordering (via token)

---

## 13. Reporting & Dashboard

### 13.1 Filters

* Period (Today, Weekly, Monthly, Yearly, Custom)
* Session
* Responsible User
* Product

---

### 13.2 Dashboard Metrics

Cards:

* Total Orders
* Revenue
* Average Order Value

Graphs:

* Revenue vs Time (dynamic)
* Top Selling Category (Pie chart)

Lists:

* Top Order (highest value)
* Top Product
* Top Category

Export options:

* PDF
* XLS

---

## 14. End-to-End System Flow Summary

1. User logs in
2. Configures POS
3. Opens session
4. Selects table
5. Creates order
6. Sends order to kitchen
7. Kitchen updates status
8. Payment completed
9. Customer display updates
10. Reports reviewed

---

## 15. Core Expectation

This project must demonstrate:

* Real-time data flow
* Correct state transitions
* ERP-style business logic
* Fully connected frontend and backend

Any broken link in this flow means the POS system is incomplete.

