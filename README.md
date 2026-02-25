# AI Dev Jumpstart Workshop - Enrollment App

Enrollment site for AI Dev Jumpstart workshop. A simple, elegant web application for managing workshop enrollments with a queue system.

## Workshop Details

- **Date:** March 11, 2026
- **Time:** 13:00 - 16:00
- **Format:** Online
- **Capacity:** 8 participants (additional enrollments go to queue)

## Features

- ✅ Simple enrollment form (name only, no email required)
- ✅ Real-time participant count display
- ✅ Automatic queue management when capacity is reached
- ✅ Persistent storage (data survives page refresh)
- ✅ Duplicate name validation
- ✅ CGI brand-compliant design
- ✅ Responsive design for mobile and desktop
- ✅ Admin functions for data management

## How to Use

### For Participants

1. Open `index.html` in your web browser
2. Enter your full name in the enrollment form
3. Click "Enroll Now"
4. See your name appear in either the "Enrolled Participants" or "Queue" section

### For Administrators

1. Open the browser's developer console (F12)
2. Available admin commands:
   - `workshopEnrollment.clearAllData()` - Clear all enrollment data
   - `workshopEnrollment.exportData()` - Export current enrollment data
   - `workshopEnrollment.enrolledParticipants` - View enrolled participants array
   - `workshopEnrollment.queuedParticipants` - View queued participants array

## Files Structure

- `index.html` - Main application interface
- `styles.css` - Styling with CGI brand colors
- `script.js` - Enrollment logic and data management
- `README.md` - This documentation

## Local Development

Simply open `index.html` in any modern web browser. No server or build process required.

## Color Guidelines

### Primary Colors

- `dark_purple` #200A58
- `cgi_purple` #5236AB
- `purple_vivid` #9E83F5
- `purple_medium` #CBC3E6
- `purple_lighter_light` #E6E3F3
- `purple_lightest_light` #F2F1F9

### Neutrals

- `action_link_text_color` #151515
- `default_link_text_color` #333333
- `dark_gray` #A8A8A8
- `action_link_bg` #E8E8E8
- `gray_hero` #EFEFEF
- `gray_bg` #F8F8F8

### Status Colors

- `success` #1AB977
- `warning` #FFAC25
- `error` #B00020
