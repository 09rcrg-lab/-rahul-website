# Rahul Live

Rahul Live is a short-video and live-streaming social application.

## Features

- User Registration
- User Login
- Short Video Feed
- Video Upload
- Video Likes
- Video Comments
- Video Shares
- Video Views
- Follow / Unfollow
- User Profiles
- Live Streaming
- Live Viewers
- Live Chat
- Live Reactions
- Live Notifications
- User Reports
- Live Moderation
- Admin System

## Project Files

- `.gitignore`
- `README.md`
- `database.sql`
- `index.html`
- `script.js`
- `style.css`
- `worker.js`
- `wrangler.jsonc`

## Database

The project uses Cloudflare D1.

Database:

`rahulsocialhub-db`

Worker binding:

`DB`

The database structure is stored in:

`database.sql`

## Backend

The backend is handled by:

`worker.js`

Main API areas include:

- `/api/register`
- `/api/login`
- `/api/profile`
- `/api/test`
- `/api/health`

## Short Videos

The application is designed for vertical short-video content.

Planned working features include:

- Upload videos
- Video feed
- Video playback
- Likes
- Comments
- Shares
- Views
- Follow system
- Creator profiles

## LIVE Streaming

Rahul Live also supports the LIVE streaming system.

Planned working LIVE features include:

- Start LIVE
- Camera access
- Microphone access
- Live broadcast
- Live viewers
- Live chat
- Live reactions
- Live notifications
- Live moderation
- End LIVE

The browser camera and microphone permission system is already prepared in the frontend.

The actual live broadcasting infrastructure will be connected through the backend/streaming system.

## Authentication

Users must:

1. Register an account
2. Login
3. Enter the main application

The main application should not be shown before authentication.

## Mobile Support

The interface is designed primarily for mobile devices.

The project is also intended to work in:

- Android browsers
- Chrome
- iPhone browsers
- Desktop browsers

The application can later be packaged as an Android application.

## Design

The main design direction is:

- Black background
- Neon green branding
- Mobile-first interface
- Vertical video experience
- LIVE streaming interface
- Fast and simple navigation

## Development Rule

Features should be implemented as working functionality wherever technically possible.

Placeholder buttons should not be used when a real implementation can be connected.

Development is being done one complete project file at a time.

## Cloudflare

The project uses Cloudflare Workers and Cloudflare D1.

The Worker configuration is stored in:

`wrangler.jsonc`

The D1 database binding is:

`DB`

## Project Status

Current project foundation:

- Authentication UI
- Short-video UI
- LIVE UI
- Video selection
- Camera/microphone permission
- Cloudflare Worker foundation
- D1 database structure
- Responsive mobile interface

Next development stages will connect the frontend to the backend and implement the actual video and LIVE streaming functionality.