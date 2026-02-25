# AI Dev Jumpstart Workshop - Enrollment App

Enrollment site for AI Dev Jumpstart workshop. A simple, elegant web application for managing workshop enrollments with a queue system and cloud database storage.

## Workshop Details

- **Date:** March 11, 2026
- **Time:** 13:00 - 17:00
- **Format:** Online
- **Capacity:** 8 participants (additional enrollments go to queue)

## Features

- ✅ Simple enrollment form (name only, no email required)
- ✅ Real-time participant count display
- ✅ Automatic queue management when capacity is reached
- ✅ **Cloud database storage with Supabase**
- ✅ **Environment switching (test/production)**
- ✅ **Automatic fallback to localStorage**
- ✅ Duplicate name validation
- ✅ CGI brand-compliant design
- ✅ Responsive design for mobile and desktop
- ✅ Admin functions for data management

## Database Integration

This application uses **Supabase** for cloud database storage with the following benefits:

- ☁️ **Cloud persistence** - Data survives server restarts and deployments
- 🔄 **Real-time sync** - Multiple users see updates instantly
- 🛡️ **Backup & recovery** - Automatic backups in the cloud
- 🔧 **Environment management** - Separate test and production databases
- 📊 **Admin dashboard** - View and manage data through Supabase interface

### Quick Setup

1. **Database Setup**: Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for complete setup instructions
2. **Configuration**: Update `config.js` with your Supabase project URLs and API keys
3. **Environment**: Set `ENVIRONMENT = 'test'` or `'production'` in `config.js`

## How to Use

### For Participants

1. Open `index.html` in your web browser
2. Enter your full name in the enrollment form
3. Click "Enroll Now"
4. See your name appear in either the "Enrolled Participants" or "Queue" section

### For Administrators

#### Console Commands (press F12 and use the console):

- `workshopEnrollment.clearAllData()` - Clear all enrollment data (database + localStorage)
- `workshopEnrollment.exportData()` - Export all data for backup/analysis
- `workshopEnrollment.enrolledParticipants` - View enrolled participants array
- `workshopEnrollment.queuedParticipants` - View queued participants array

#### Supabase Dashboard:

- Access your Supabase project dashboard to view/edit data directly
- Monitor API usage and performance
- Review logs for debugging issues
- Manage database schema and security settings

## Files Overview

- **`index.html`** - Main enrollment page with form and participant lists
- **`styles.css`** - CGI brand-compliant styling and responsive design
- **`script.js`** - Main application logic and enrollment management
- **`config.js`** - Supabase configuration and environment switching
- **`supabase-client.js`** - Database operations and API integration
- **`SUPABASE_SETUP.md`** - Complete database setup instructions

## Environment Management

### Test Environment

- Use for development, testing, and staging
- Safe to clear data and experiment
- Configure in `config.js`: `ENVIRONMENT = 'test'`

### Production Environment

- Live system for actual workshop enrollment
- Configure in `config.js`: `ENVIRONMENT = 'production'`
- Handle with care - real participant data

### Fallback System

- Application automatically falls back to localStorage if database is unavailable
- Ensures enrollment continues working even with connectivity issues
- Console messages indicate whether database or localStorage is being used

## Local Development

1. **Without Database**: Simply open `index.html` in any modern web browser (uses localStorage fallback)
2. **With Database**: Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) and configure `config.js`
3. **No Build Process**: Pure HTML/CSS/JavaScript - no server or build tools required

## Technical Architecture

### Data Flow

1. **User submits enrollment** → Application saves to both database and localStorage
2. **Page loads** → Application attempts to load from Supabase, falls back to localStorage if needed
3. **Real-time updates** → Multiple users see changes as they happen
4. **Admin functions** → Work with both database and localStorage for reliability

### Error Handling

- Database connection failures gracefully fall back to localStorage
- Network issues don't prevent enrollment functionality
- Console logging provides debugging information
- User-friendly error messages for validation issues

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
