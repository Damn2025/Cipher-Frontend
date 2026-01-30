# API Setup Guide

This guide explains how to set up API communication between the frontend and backend.

## Overview

The frontend and backend are now separated into two independent applications:
- **Frontend**: React application (Vite)
- **Backend**: Cloudflare Worker (Hono framework)

## Configuration

### 1. Environment Variables

Create a `.env` file in the `frontend` directory based on `.env.example`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Backend API URL
# For local development with Cloudflare Workers:
VITE_API_URL=http://localhost:8787

# For production:
VITE_API_URL=https://your-backend.workers.dev
```

### 2. Install Dependencies

Make sure to install the frontend dependencies (including the newly added `zod`):

```bash
cd frontend
npm install
```

## API Client

All API communication is handled through the centralized API client located at `src/react-app/lib/api.ts`.

### Available API Functions

#### Web Scans
- `getScans()` - Get all scans for the current user
- `getScan(id)` - Get a single scan by ID
- `getScanVulnerabilities(scanId)` - Get vulnerabilities for a scan
- `createScan(data)` - Create a new scan
- `deleteScan(id)` - Delete a scan
- `performTrialScan(data)` - Perform a trial scan (without saving)
- `saveTrialScan(data)` - Save a trial scan to database
- `exportScanReport(scanId, format)` - Export scan report (pdf/json/csv/html)
- `performCWETop25Scan(targetUrl)` - Perform CWE Top 25 scan
- `performNISTSP800171Scan(targetUrl)` - Perform NIST SP 800-171 compliance scan

#### Mobile Scans
- `getMobileScans()` - Get all mobile scans for the current user
- `getMobileScan(id)` - Get a single mobile scan by ID
- `getMobileScanVulnerabilities(scanId)` - Get vulnerabilities for a mobile scan
- `createMobileScan(file, platform)` - Create a new mobile scan with file upload
- `deleteMobileScan(id)` - Delete a mobile scan
- `performTrialMobileScan(file, platform)` - Perform a trial mobile scan
- `saveTrialMobileScan(data)` - Save a trial mobile scan to database
- `exportMobileScanReport(scanId, format)` - Export mobile scan report

#### Dashboard
- `getDashboardStats()` - Get dashboard statistics

### Authentication

All API requests automatically include authentication headers when a user session exists. The API client uses Supabase session tokens for authentication.

## Usage Example

```typescript
import { createScan, getScans } from '@/react-app/lib/api';
import type { CreateScan } from '@/shared/types';

// Create a new scan
const newScan: CreateScan = {
  target_url: 'https://example.com',
  scan_type: 'standard'
};

try {
  const scan = await createScan(newScan);
  console.log('Scan created:', scan);
} catch (error) {
  console.error('Failed to create scan:', error);
}

// Get all scans
const scans = await getScans();
console.log('All scans:', scans);
```

## Running the Applications

### Backend (Cloudflare Worker)

```bash
cd backend
npm install
npm run dev  # Starts on http://localhost:8787
```

### Frontend (React)

```bash
cd frontend
npm install
npm run dev  # Starts on http://localhost:5173 (or another port)
```

Make sure to set `VITE_API_URL=http://localhost:8787` in your frontend `.env` file when developing locally.

## Type Safety

All types are shared between frontend and backend through `src/shared/types.ts`. This ensures type safety across the entire application.

## Error Handling

The API client includes comprehensive error handling. All API functions will throw errors that can be caught and handled appropriately:

```typescript
try {
  const scan = await getScan(123);
} catch (error) {
  if (error instanceof Error) {
    console.error('API Error:', error.message);
  }
}
```
