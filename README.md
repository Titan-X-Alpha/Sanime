# SANIME — Your Anime. Your World.
> A private, ad-free, personal anime streaming platform. Maintain your own profiles, upload anime episodes directly to Cloudflare R2, stream them privately, track watch progress, and synchronize playback preferences across devices.

![SANIME Interface Reference](/public/images/hero-banner.jpg)

---

## 1. Product Overview

**SANIME** is designed as a personal, ad-free streaming home for anime enthusiasts:
- **Visual Design**: Cinematic dark theme with purple and violet accents (`#080910` deep navy background, `#8B3DFF` accent, `#302B48` borders, glassmorphic cards, and subtle cherry blossom ambiance).
- **Username-Only Authentication**: Frictionless onboarding requiring only a username—no passwords, emails, or personal data required.
- **Multi-Profile Isolation**: Individual profiles with independent watch progress, continue watching queues, watchlists, and playback preferences.
- **Cloudflare R2 Object Storage**: Direct browser-to-R2 presigned upload flow, private bucket architecture, and short-lived streaming URLs.
- **Storage Accounting & Quota System**: Real-time storage ledger tracking committed data and pending upload reservations, with warning thresholds at 80% (Warning) and 95% (Critical).
- **Customizable Video Player**: Fullscreen API player, seeking, volume, playback speed (0.5x–2x), multi-audio track selection, WebVTT subtitles, quality selection, keyboard shortcuts, and debounced watch progress synchronization.

---

## 2. Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript (Strict Mode), Tailwind CSS, Lucide Icons.
- **Backend**: Next.js Server Route Handlers, Zod Request Validation, Server-managed HTTP-only Session Cookies.
- **Database**: Supabase PostgreSQL + Transparent local persistent fallback (`.data/sanime_store.json`) for zero-friction local development.
- **Object Storage**: Cloudflare R2 (S3-compatible AWS SDK v3 `@aws-sdk/client-s3` & `@aws-sdk/s3-request-presigner`).
- **Testing**: Vitest test runner with automated test suites for Authentication, Quota Accounting, and Watch Progress isolation.

---

## 3. Directory Structure

```text
sanime/
├── app/
│   ├── login/page.tsx               # Panel 1: Centered authentication card & shrine art
│   ├── register/page.tsx            # Panels 2 & 3: Account creation & success state
│   ├── page.tsx                     # Panel 4: Home Dashboard & continue watching banner
│   ├── anime/page.tsx               # Anime catalog & genre filtering
│   ├── anime/[id]/page.tsx          # Anime details & episode list
│   ├── watch/[episodeId]/page.tsx   # Video playback surface
│   ├── watchlist/page.tsx           # Bookmarked titles
│   ├── history/page.tsx             # Watch progress & history
│   ├── storage/page.tsx             # Cloudflare R2 storage dashboard
│   ├── settings/page.tsx            # Player preferences & quota configuration
│   └── api/                         # REST API routes (auth, anime, storage, playback)
├── components/
│   ├── layout/                      # Sidebar, TopNav, AppLayout, MobileDrawer
│   ├── player/                      # SanimePlayer (Fullscreen, tracks, speed, sync)
│   └── anime/                       # UploadEpisodeModal (Direct R2 uploads)
├── lib/
│   ├── auth/session.ts              # Session cookies & username normalization
│   ├── database/client.ts           # Supabase client + local fallback adapter
│   ├── storage/r2.ts                # Cloudflare R2 client & presigned URLs
│   ├── quota/ledger.ts              # Storage ledger & threshold calculations
│   ├── utils/format.ts              # Byte formatting utilities
│   └── validation/schemas.ts        # Zod validation schemas
├── supabase/migrations/
│   └── 20261022000000_sanime_schema.sql # PostgreSQL schema & RLS policies
├── tests/                           # Vitest test suites (auth, quota, progress)
├── public/                          # Anime posters, backgrounds, subtitles
├── .env.example                     # Environment template
└── package.json
```

---

## 4. Local Development Setup

SANIME is designed to run locally **immediately without requiring third-party credentials upfront**. It includes built-in mock/adapter layers for Cloudflare R2 and Supabase, pre-seeded with sample anime matching the design reference (*Solo Leveling*, *Dan Da Dan*, *Demon Slayer*, *Jujutsu Kaisen*, *One Piece*).

### Prerequisites
- Node.js `v18.x` or later (tested on `v24.18.1`)
- npm `v9.x` or later

### Steps
1. Clone or navigate to the repository directory:
   ```bash
   cd Sanime
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Create your local environment configuration:
   ```bash
   cp .env.example .env.local
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```
   - On first visit, enter username `User` or click **"Demo: Quick enter as 'User'"**.
   - Or click **"Register here"** to create a custom profile.

---

## 5. Running Automated Tests

Run the Vitest test suite to verify authentication logic, storage accounting, and progress isolation:

```bash
npm test
```

Expected output:
```text
 ✓ tests/progress.test.ts (3 tests)
 ✓ tests/quota.test.ts (3 tests)
 ✓ tests/auth.test.ts (4 tests)

 Test Files  3 passed (3)
      Tests  10 passed (10)
```

To run a production build verification:
```bash
npm run build
```

---

## 6. Cloudflare R2 Configuration Guide

Cloudflare R2 provides S3-compatible, zero-egress object storage.

### 1. Create a Bucket
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left navigation, select **R2 Storage** → **Create Bucket**.
3. Name your bucket (e.g., `sanime-media`) and keep access **Private**.

### 2. Configure CORS
In bucket settings, add the following CORS policy to allow direct browser uploads:
```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-sanime-deployment.vercel.app"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

### 3. Generate API Credentials
1. In Cloudflare R2, click **Manage R2 API Tokens** → **Create API Token**.
2. Permissions: **Object Read & Write**.
3. Specify your target bucket (`sanime-media`).
4. Copy the generated:
   - **Account ID**
   - **Access Key ID**
   - **Secret Access Key**

### 4. Add to Environment
Update `.env.local` or Vercel environment variables:
```env
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=sanime-media
```

---

## 7. Supabase Database Setup

### 1. Create Project
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Note your project URL and API keys (Anon key & Service Role key) in **Project Settings** → **API**.

### 2. Apply Migrations
Open the **SQL Editor** in Supabase and execute the contents of:
`supabase/migrations/20261022000000_sanime_schema.sql`

This creates:
- `profiles` table with unique normalized usernames.
- `anime` and `episodes` tables with cascade deletion.
- `media_assets` table tracking Cloudflare R2 object keys and verified byte sizes.
- `watch_progress` table recording timestamps and completion status.
- `watchlist` table for bookmarked series.
- `player_preferences` table for audio/subtitle/speed preferences.
- `upload_jobs` table for capacity reservation locking.
- Row-Level Security (RLS) policies.

### 3. Configure Environment
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

---

## 8. Vercel Deployment Guide

1. Push your SANIME repository to GitHub / GitLab.
2. Import the repository in [Vercel](https://vercel.com/new).
3. In **Environment Variables**, supply:
   - `NEXT_PUBLIC_APP_URL`
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
4. Click **Deploy**. Vercel will build and launch your production Next.js application.

---

## 9. Security & Authentication Disclosure

> [!WARNING]
> **Username-Only Authentication Notice**:
> As specified in the product requirements, SANIME implements a frictionless, username-only authentication experience without passwords, emails, or phone verification.
> 
> Anyone who knows or guesses a username can open that profile and access its watch history, watchlist, and preferences. This design is intended strictly for personal/family use or trusted private circles. Never host sensitive, unencrypted private documents under this model.

---

## 10. Verification Summary

| Requirement | Implementation | Status |
| :--- | :--- | :---: |
| **Visual Fidelity** | Panels 1, 2, 3, 4 matched to screenshot reference | **PASSED** |
| **Username-Only Flow** | Client & server validation, normalization, cookie sessions | **PASSED** |
| **Direct Cloudflare R2 Uploads** | Short-lived presigned PUT URLs, HeadObject verification | **PASSED** |
| **Storage Quota Accounting** | Real ledger, reservations, 80% & 95% alerts | **PASSED** |
| **Video Player** | Fullscreen API, WebVTT subtitles, audio selection, speed | **PASSED** |
| **Progress Synchronization** | Debounced 5s auto-save, 90% completion rule, resume | **PASSED** |
| **Multi-Profile Isolation** | Separate watch progress, watchlist, and preferences | **PASSED** |
| **Automated Tests** | 10/10 Vitest tests passing | **PASSED** |
| **Production Build** | TypeScript and Next.js 14 production bundle | **PASSED** |
