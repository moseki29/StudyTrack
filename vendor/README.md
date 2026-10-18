# Offline document parsers

These browser libraries are served from this folder and run locally. They do not upload document contents or make network requests.

- `pdf.min.mjs` and `pdf.worker.min.mjs`: PDF.js 4.10.38, Mozilla, Apache License 2.0. See `PDFJS-LICENSE.txt`.
- `mammoth.browser.min.js`: Mammoth.js 1.13.0, BSD 2-Clause License. See `MAMMOTH-LICENSE.txt`.

PDF.js uses its bundled local worker. PDF import therefore needs the app to be served from localhost (use `Run Daily Targets.bat`); browsers restrict local PDF worker modules on `file://` pages.

The importer accepts `.docx` Word documents and PDFs that contain selectable text. Legacy `.doc` files and scanned image/OCR PDFs are not supported.
