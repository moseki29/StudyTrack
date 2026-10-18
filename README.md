# StudyTrack

A local-first study planner for daily tasks, classes, focused sessions, and study files. The Today menu opens a two-panel dashboard: today's activities in time order, plus completion, current-week streak, seven-day history, and progress by course. Assign the same course name to a task, schedule block, or session to keep its color consistent. Leave `supabase-config.js` empty to keep this a no-account app. Each device and browser keeps its own planner and file library; using the app on a laptop and phone does not sync them.

## Use it on your laptop

Double-click **Run Daily Targets.bat**. It starts the local server and opens <http://127.0.0.1:8765/>. Keep its PowerShell window open while you use the planner. In Chrome or Edge, wait for Settings to say the offline app files are ready, then use **Install StudyTrack** or the browser's install option. After the first successful cache, the laptop copy can open offline. Optional sign-in and OCR library downloads still need internet.

## Open a separate copy on your phone

1. Connect the phone and laptop to the same trusted home Wi-Fi.
2. Close the laptop-only launcher if it is already running. Double-click **Run on Wi-Fi for phone.bat**. Keep the PowerShell window open.
3. Open the `http://<laptop-address>:8765/` link printed by the launcher in the phone browser. If Windows Firewall asks, allow access on **Private networks only**. Do not run this on public Wi-Fi.
4. On iPhone, open the address in Safari and use **Share → Add to Home Screen**. On Android, use the browser menu's **Install app** or **Add to Home screen** option when available.

The Wi-Fi launcher serves only the app's static files. Your phone stores its own planner and uploaded files in the phone browser; the laptop's browser has a separate copy. The laptop and Wi-Fi must stay on while the phone uses this local address. Use the same phone browser and address each time. If the laptop's local IP address changes, the browser may treat the new address as a new local copy; export a backup before moving data.

The laptop URL is plain HTTP on a local network. The planner works there, but browsers restrict service-worker caching and full PWA installation to secure HTTPS origins or localhost. So a Home Screen shortcut to the local Wi-Fi address may still require the laptop to be on. For independent offline installation on the phone, the app needs a trusted HTTPS address; no public hosting has been set up. The service worker and manifest are already included for that route. [Apple's iPhone instructions](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios) and [PWA installation requirements](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) have more detail.

## Backups and separate data

Use **Export JSON backup** in Settings to move planner state or the local file library manually. Import replaces the current browser's saved planner data and file library after confirmation. Keep the backup private because it may contain the contents of your files. Local data is scoped to its browser and origin; an installed copy on another device starts separately.

## Optional accounts and cloud sync

The default `supabase-config.js` is unconfigured, which starts the local-only app without sign-in. If you later choose to enable Supabase, planner goals and schedule data can sync between accounts/devices; that would no longer be the separate-copy setup described above. File blobs and file-library metadata remain local even when cloud sync is enabled.

To enable accounts later:

1. Create a project in Supabase.
2. In the Supabase SQL Editor, run [`supabase/schema.sql`](./supabase/schema.sql). It creates the account data table and row-level security policies so each signed-in user can only read or change their own data.
3. Copy the project's URL and its **publishable** key (or legacy `anon` key) into `supabase-config.js`:

   ```js
   window.DAILY_TARGETS_SUPABASE = {
     url: 'https://YOUR-PROJECT.supabase.co',
     anonKey: 'YOUR-PUBLISHABLE-OR-ANON-KEY'
   };
   ```

   This browser key is intended to be public; never put a Supabase `service_role` key in this app.
4. In Supabase **Authentication → URL Configuration**, add the app's address to allowed redirect URLs. For the laptop launcher, use `http://127.0.0.1:8765/**` and set the Site URL to `http://127.0.0.1:8765/`. For a hosted copy, use its HTTPS address instead.
5. Enable email/password sign-in in **Authentication → Providers → Email**. If email confirmation is enabled, users must confirm their address before signing in.

## Use the planner

Click a menu name at the top to open that area; its forms, options, and related tools are grouped there.

The **Today** menu brings together your daily goals, schedule blocks, and sessions that fall on today's date, arranged by time (untimed goals appear last). Add the same optional course name to a task, class, or session to assign a consistent color and group its progress. Use the checkmark for complete/incomplete or the small plus/minus controls to count partial daily-goal progress. The Progress card summarizes completion across today's planned items, consecutive fully-complete days this week, progress by course, and the previous seven days.

In the **Schedule** menu, choose a Word `.docx` file or a text-based PDF. The document is read locally in your browser. Review the extracted text, correct it if needed, then choose **Find schedule blocks**. Check the preview before adding the blocks. The app creates a reminder for the lead time before each class and a second reminder at its start time.

The importer accepts lines like:

```text
Monday | Lecture: Databases | 09:00 | 10:30 | 10
2026-10-13 | Study group | 14:00-15:00
```

The final number is the reminder lead time in minutes; if omitted, it defaults to 10. The first example repeats each Monday. The date in the second example makes it a one-off. The schedule importer does not automatically read scanned/image-only PDFs; use the optional local OCR/text-layer actions in My Files or enter schedule text manually. Legacy `.doc` files are not supported. Keep the app open for reminders; allow browser notifications if you want operating-system alerts as well.

In the **Sessions** menu, enter your own comma-separated categories or tags when adding or editing a study session (for example, `Biology, Exam prep`). Tags appear on the session and can be searched or filtered; tap a tag chip to filter quickly. Use up to 8 labels per session, with a maximum of 32 characters each. Tags are saved with planner data and included in JSON backups.

## My Files — local-only library

The **My Files** area accepts multiple PDF, DOCX, TXT, MD, CSV, PNG, JPG/JPEG, WEBP, or GIF files at up to 10 MB each. Uploads can be selected or dragged in; each file shows read/save progress and a per-file error if it cannot be added. Search names/tags and filter by document type or tag. Preview, download, rename, tag, link a file to a schedule block or study session, and delete files from the library. Deleting a file also removes its session/schedule links after confirmation.

Each browser account has a separate namespace in IndexedDB. File blobs and their metadata (name, type, size, tags, upload time, and linked items) stay on this device and are never sent to Supabase. The Settings panel displays usage toward a 100 MB soft limit, warns when approaching it, and shows a browser quota estimate when available. Browser storage quotas apply; make a backup if the files matter to you.

TXT/MD/CSV content is previewed as text only. PDFs open in a sandboxed viewer; images open in a zoomable preview; DOCX files can be downloaded to view. File content is treated as data, never executed. The optional image OCR and PDF text-layer tools fetch pinned Tesseract.js 5.1.1 / PDF.js 3.11.174 scripts from public CDNs when requested; processing uses the local file bytes in the browser. OCR therefore needs a network connection to load its library, but does not upload the image or PDF.

**Export JSON backup** includes planner state, file metadata, and file contents encoded as Base64. The app warns before exporting more than 25 MB of files because Base64 increases backup size by about one-third. Treat the JSON as private because it may contain all exported documents and pictures. Import replaces the current account's planner data and local file library on this device after confirmation.

## Included files

The PWA manifest, install icons, offline service worker, Windows launchers, optional phone-on-Wi-Fi static server, Supabase schema/configuration, and bundled PDF/Word parser assets are included. Do not open `index.html` as a `file://` page; use one of the launchers so the bundled module and worker files can load correctly.

## macOS or Linux

Install Python 3 if needed, then open a terminal in this folder and run `python3 serve-local.py --open` for laptop-only use. To let a phone on the same trusted Wi-Fi connect, use `python3 serve-local.py --lan --open` instead. Press Ctrl+C to stop the server. The `run-local.sh` and `run-lan.sh` scripts are convenient terminal launchers. The LAN address is still plain HTTP, so it runs only while the laptop is available and is not an offline PWA origin.
