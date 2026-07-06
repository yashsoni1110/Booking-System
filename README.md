# MechBook Pro - Mechanic Booking System

A feature-complete, zero-dependency CRUD application designed specifically for mechanic shop floors. Built to replace manual paper systems and Excel sheets, providing a fast, resilient, and fully local digital workflow.

## 🚀 Features

*   **Fully Offline Capable:** Data is stored locally in the browser using `localStorage`. If the shop's internet connection drops, the system continues to work perfectly with zero data loss.
*   **Feature-Complete CRUD:** Create, Read, Update, and Delete records for **Bookings**, **Mechanics**, and **Customers**.
*   **Data Integrity & Security:** Built-in XSS (Cross-Site Scripting) protection safely sanitizes all text rendering, meaning special characters or malformed inputs will never break the UI.
*   **Safety Nets:** Includes an "Undo" stack. If a user accidentally deletes a record, a toast notification allows them to immediately recover it.
*   **CSV Data Export:** Easily export booking records directly to a fully formatted `.csv` file for accounting and backup purposes.
*   **Inline Editing:** Change booking statuses directly from the main view without opening heavy modals.
*   **Responsive Design:** Fully responsive CSS layout using CSS Grid and Flexbox. Works perfectly on desktop monitors, tablets, and mobile phones.
*   **Accessible:** Heavy implementation of ARIA tags for screen readers and keyboard accessibility.

## 🛠️ Technology Stack

This project was built intentionally without heavy frameworks (React, Vue, Angular) or bulky CSS libraries (Tailwind, Bootstrap) to ensure maximum speed and minimal maintenance.

*   **Frontend Structure:** Vanilla HTML5
*   **Styling:** Vanilla CSS3 (Custom Variables, CSS Grid, Flexbox)
*   **Logic & State:** Vanilla ES6 JavaScript

## 📦 Installation & Usage

Because the application is fully client-side with zero dependencies, there is no build step or server required.

1.  Clone or download this repository.
2.  Open `index.html` in any modern web browser (Chrome, Firefox, Safari, Edge).
3.  The system will automatically initialize with a set of seed demo data for you to explore.

## 🗂️ File Structure

*   `index.html`: The main single-page application structure. Contains semantic markup and ARIA accessibility tags.
*   `styles.css`: The corporate monochromatic design system. Contains all CSS variables, media queries, and animations.
*   `app.js`: The brain of the application. Handles DOM manipulation, the `localStorage` state management IIFE, search, filtering, sorting, and CSV generation.

## ⚙️ How State is Managed

State is handled via a tightly encapsulated `Store` immediately invoked function expression (IIFE) in `app.js`. It intercepts all CRUD operations, ensures data is safely written to `localStorage`, and provides getter methods to map the UI to the current state.
