# CALI — Maskottchen-Bilder

Freigestellte PNGs (transparenter Hintergrund) der mintgrünen Schildkröte.
Die Original-Renders haben grauen Hintergrund und müssen vor dem Einsatz
freigestellt werden — sonst erscheint auf dem dunklen Reset ein grauer Kasten.

## Im Einsatz

| Datei | Wo im Reset | Angezeigte Größe |
|---|---|---|
| `cali-head.png` | Startseite, unter der Überschrift | 70px hoch mobil · 86px ab Tablet |
| `cali-day.png` | Wochenübersicht, Icon bei allen 7 Tagen | 28px |
| `cali-waitlist.png` | Wartelisten-Block (/app) | 180px hoch mobil · 200px ab Tablet |

`cali-explain.png` liegt ungenutzt bereit (Portrait, 48px) — war ursprünglich
neben der Reset-Erklärung geplant, dort steht jetzt bewusst kein zweites
Maskottchen, weil zwei CALIs auf einem Screen beliebig wirkten.

## Wichtig
- Größen werden über die **Höhe** begrenzt (`h-[...] w-auto`), nicht über die
  Breite: die Motive sind hochformatig, über die Breite begrenzt wächst der
  Hero und drückt das E-Mail-Feld aus dem sichtbaren Bereich.
- Fehlt eine Datei, blendet sich der jeweilige Slot automatisch aus
  (kein kaputtes Bild-Icon) — einzeln nachliefern ist also gefahrlos.
- Neue Motive einfach hier ablegen; Freistellen + Zuschneiden übernimmt Claude.
