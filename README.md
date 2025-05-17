# Guestbook PRD & Project Status

---

## Product Requirements Document (PRD)

### NFRs

| NFRs                | Delivery phase | Implementation                                                                                  | Notes/Links                                                                                      |
|---------------------|---------------|-----------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|
| Repo set up         | Demo          | Monorepo/turborepo                                                                            |                                                                                                  |
| Infrastructure      | Demo          | S3, EventBridge, ECS/Fargate, Dynamo (?)                                                      |                                                                                                  |
| CI/CD               | Demo          | GitHub Actions                                                                                |                                                                                                  |
| App Clip/Instant Apps | MVP         | If S3 version, then consider WebView at end                                                   |                                                                                                  |
| UI/UX               | Demo          | Next                                                                                          |                                                                                                  |
| QR code CDN         | Demo          | Cloudinary? s3??                                                                              |                                                                                                  |

---

### Backend services

| Feature                        | Delivery phase | Implementation/Notes                                                                                  |
|--------------------------------|---------------|-------------------------------------------------------------------------------------------------------|
| QR code generate -> Event      | Demo          | Library - if invalidation and regeneration is a lot of work, push to V2                               |
| Create a message               | Demo          | S3 upload API > Limit 2 audio and 2 video                                                             |
| Create an event                | Demo          | Next/Dynamo                                                                                           |
| Edit an event                  | Demo          | Next/Dynamo                                                                                           |
| List events                    | Demo          | Next/Dynamo                                                                                           |
| Get Event (guests, package, dates) | MVP      | Next/Dynamo                                                                                           |
| Payment integration            | Demo          | Stripe or wrapper                                                                                     |
| Audio batch processing         | Demo          | Event driven job                                                                                      |
| Video batch processing         | Demo          | Event driven job                                                                                      |

---

### Guest Portal (Browser/PWA)

| Feature                        | Delivery phase | Implementation/Notes                                                                                  |
|--------------------------------|---------------|-------------------------------------------------------------------------------------------------------|
| QR code display                | Demo          | qrcode library                                                                                        |
| Event has not started/ended page | Demo        |                                                                                                       |
| Event reached recording limit  | Demo          | 50% buffer on the cookies                                                                            |
| Audio recording                | Demo          | Client side blob, no need for playback in browser                                                     |
| Paywalled video recording      | Demo          | Client side blob                                                                                      |
| Cancel recording               | Demo          | Client side blob                                                                                      |
| Compression                    | Demo          |                                                                                                       |
| Submit message                 | Demo          | S3 file storage solution + save url or "path" to database                                             |
| Limit recordings per person    | Demo          |                                                                                                       |

---

### Event Portal (Desktop/mobile)

| Feature                        | Delivery phase | Implementation/Notes                                                                                  |
|--------------------------------|---------------|-------------------------------------------------------------------------------------------------------|
| Authentication                 | Demo          | openauth/clerk                                                                                        |
| SSO                            | MVP           | ^                                                                                                     |
| Create new event               | Demo          |                                                                                                       |
| Audio recording                | Demo          |                                                                                                       |
| Images upload                  | Demo          |                                                                                                       |
| Text entry                     | Demo          | Title and description                                                                                 |
| Pay for event                  | Demo          | Payment after create account                                                                          |
| QR code display                | Demo          |                                                                                                       |
| List events                    | Demo          |                                                                                                       |
| Message list                   | Demo          |                                                                                                       |
| Message playback               | Demo          | Both individual and stitched                                                                          |
| Event sharing                  | Demo          | Sharing?                                                                                              |

---

## Project Status Checklist

### Partially Complete / In Progress
- [ ] Infrastructure: S3 upload logic is stubbed, not fully implemented; Dynamo/EventBridge/ECS not confirmed
- [ ] CI/CD: No GitHub Actions config found in root (may be managed elsewhere)
- [ ] Audio/video recording (`components/media-recorder.tsx`)
- [ ] Message playback (`components/media-player.tsx`)
- [ ] Authentication/SSO: No openauth/clerk or SSO logic found
- [ ] Batch processing (audio/video): No event-driven job logic found
- [ ] Recording limits: No explicit logic for per-person or per-event limits
- [ ] Compression: Not found
- [ ] Cancel recording: UI may allow, but not confirmed in code
- [ ] Event has not started/ended page: Not confirmed
- [ ] Event reached recording limit: Not confirmed
- [ ] Get Event (guests, package, dates): Event model supports it, but not all endpoints confirmed
- [ ] QR code CDN: No Cloudinary or CDN logic found, only static asset

### Completed Features
- [x] Repo set up (Monorepo/turborepo, Next.js, pnpm, etc.)
- [x] UI/UX (Next.js, Tailwind, custom components)
- [x] QR code display (static asset, likely used in UI)
- [x] PWA support (`next-pwa`, `public/manifest.json`)
- [x] Create an event frontend `app/create/page.tsx`
- [x] Edit an event frontend `app/events/[id]/edit/page.tsx`
- [x] List events frontend (Event listing logic in types and pages)
- [x] Create a message frontend (Guest page allows message recording/upload)

- [x] Submit message frontend (Guest page, S3 upload logic in `lib/upload-media.ts`)
- [x] Text entry (Event creation form includes title/description)
- [x] Payment integration (Stripe, `/api/checkout-session`)
- [x] Event sharing frontend (event codes/QR imply sharing)
- [x] Pay for event (Stripe integration in event creation flow)
- [x] Images upload frontend (Banner image upload in event creation)
- [x] Event portal (desktop/mobile) (Responsive Next.js app)
- [x] Guest portal (browser/PWA) (Guest message submission, QR, etc.)

---

## Next steps

Setup selectroDB + S3 to persist created events 
Fix media recording
Check event package and hide video message submission option
Fix asking for permissions bug
Add warning if message recorded and switched mediums
Generate QR code
Test + fix guest flow

If full flow works then add auth