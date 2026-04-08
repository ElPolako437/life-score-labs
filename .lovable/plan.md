

## Plan: Favicon und PWA-Icon aktualisieren

Das hochgeladene Logo (weiß auf transparent) wird als neues App-Icon verwendet. Da der Hintergrund der App dunkel ist (`#0a0c0e`), wird das weiße Logo auf diesem dunklen Hintergrund platziert — so sieht es auf dem Homescreen professionell aus.

### Schritte

1. **Logo-Datei kopieren** — `user-uploads://logo_2_white_transparent_backgroud_851.png` → `public/favicon-512.png` (überschreibt das bestehende)

2. **Altes favicon.ico entfernen** — falls vorhanden, löschen damit Browser nicht das alte laden

3. **PWA Manifest prüfen** — `site.webmanifest` referenziert bereits `/favicon-512.png` mit `512x512` und `purpose: "any maskable"` — passt bereits

4. **index.html** — referenziert bereits `/favicon-512.png` für alle Icon-Größen — keine Änderung nötig

### Hinweis
Das Logo ist weiß auf transparent. Auf dem Homescreen (iOS/Android) wird der `background_color: "#0a0c0e"` aus dem Manifest genutzt, sodass das weiße Logo auf dunklem Grund erscheint. Falls das Ergebnis auf iOS nicht optimal aussieht (Apple ignoriert teilweise den Manifest-Hintergrund), kann ein zusätzliches `apple-touch-icon` mit eingebettetem dunklem Hintergrund generiert werden.

