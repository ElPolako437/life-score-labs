import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont, PDFName, PDFBool, PDFImage } from 'pdf-lib';

// Logo URL for embedding
const LOGO_URL = '/images/caliness-logo-pdf.png';

// ═══════════════════════════════════════════════════════════════════════════
// CALINESS 7-Tage Reset – Interactive PDF Generator
// Matches HTML template: public/pdfs/caliness-7-tage-reset.html
// ═══════════════════════════════════════════════════════════════════════════

// Premium Brand Colors (Dark Theme)
const CALINESS_GREEN = rgb(45 / 255, 211 / 255, 111 / 255); // #2dd36f
const BACKGROUND = rgb(10 / 255, 12 / 255, 14 / 255); // #0a0c0e
const TEXT_PRIMARY = rgb(255 / 255, 255 / 255, 255 / 255); // White
const TEXT_SECONDARY = rgb(232 / 255, 232 / 255, 232 / 255); // #e8e8e8
const TEXT_MUTED = rgb(120 / 255, 120 / 255, 120 / 255); // Subtle gray
const TEXT_SUBTLE = rgb(180 / 255, 180 / 255, 180 / 255); // Light gray
const CARD_BG = rgb(15 / 255, 17 / 255, 19 / 255); // Slightly lighter
const CARD_BORDER = rgb(35 / 255, 37 / 255, 39 / 255);
const LINE_COLOR = rgb(40 / 255, 42 / 255, 44 / 255);
const CHECKBOX_BG = rgb(20 / 255, 22 / 255, 24 / 255);
const GREEN_SUBTLE_BG = rgb(15 / 255, 25 / 255, 20 / 255); // For priority box

// A4 dimensions in points
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

// Margins matching HTML template
const MARGIN_LEFT = 62; // ~22mm
const MARGIN_RIGHT = 62;
const MARGIN_TOP = 57; // ~20mm
const MARGIN_BOTTOM = 68; // ~24mm
const CONTENT_WIDTH = A4_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

// Protocol content
const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const HABITS = [
  '30 Min ruhige Bewegung',
  '5.000–7.000 Schritte',
  'Zwei proteinreiche Mahlzeiten',
  'Keine Snacks',
  'Feste Schlafenszeit (8h)',
  '30 Min Offline',
  'Kein Alkohol',
];

// Helper to wrap text
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

// Draw footer on each page with logo
function drawFooter(page: PDFPage, fontBold: PDFFont, fontRegular: PDFFont, pageNum: number, logoImage?: PDFImage) {
  const footerY = MARGIN_BOTTOM - 20;
  
  // Subtle separator line
  page.drawLine({
    start: { x: MARGIN_LEFT, y: footerY + 16 },
    end: { x: A4_WIDTH - MARGIN_RIGHT, y: footerY + 16 },
    thickness: 0.3,
    color: LINE_COLOR,
  });
  
  // Logo in footer (if available)
  if (logoImage) {
    const logoHeight = 10;
    const logoWidth = (logoImage.width / logoImage.height) * logoHeight;
    page.drawImage(logoImage, {
      x: MARGIN_LEFT,
      y: footerY - 2,
      width: logoWidth,
      height: logoHeight,
      opacity: 0.5,
    });
    
    // Tagline after logo
    page.drawText('·  Longevity als System.', {
      x: MARGIN_LEFT + logoWidth + 8,
      y: footerY,
      size: 7,
      font: fontRegular,
      color: TEXT_MUTED,
    });
  } else {
    // Fallback text if no logo
    page.drawText('CALINESS', {
      x: MARGIN_LEFT,
      y: footerY,
      size: 7,
      font: fontBold,
      color: TEXT_MUTED,
    });
    
    const brandWidth = fontBold.widthOfTextAtSize('CALINESS', 7);
    page.drawText('  ·  Longevity als System.', {
      x: MARGIN_LEFT + brandWidth,
      y: footerY,
      size: 7,
      font: fontRegular,
      color: TEXT_MUTED,
    });
  }
  
  // Page number
  const pageText = `${pageNum} / 3`;
  const pageTextWidth = fontRegular.widthOfTextAtSize(pageText, 7);
  page.drawText(pageText, {
    x: A4_WIDTH - MARGIN_RIGHT - pageTextWidth,
    y: footerY,
    size: 7,
    font: fontRegular,
    color: TEXT_MUTED,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 1: Cover Page (Centered, with logo)
// ═══════════════════════════════════════════════════════════════════════════
function drawPage1(page: PDFPage, fontBold: PDFFont, fontRegular: PDFFont, logoImage?: PDFImage) {
  // Fill background - use slightly smaller rectangle to prevent mobile rendering issues
  page.drawRectangle({
    x: 0.5, y: 0.5,
    width: A4_WIDTH - 1, height: A4_HEIGHT - 1,
    color: BACKGROUND,
  });
  
  // Top green accent bar
  page.drawRectangle({
    x: 0,
    y: A4_HEIGHT - 3,
    width: A4_WIDTH,
    height: 3,
    color: CALINESS_GREEN,
  });
  
  const centerX = A4_WIDTH / 2;
  let y = A4_HEIGHT - 200;
  
  // Premium Logo centered on cover
  if (logoImage) {
    const logoHeight = 48;
    const logoWidth = (logoImage.width / logoImage.height) * logoHeight;
    page.drawImage(logoImage, {
      x: centerX - logoWidth / 2,
      y: y,
      width: logoWidth,
      height: logoHeight,
    });
    y -= 70;
  } else {
    // Fallback text
    const brandText = 'CALINESS';
    const brandWidth = fontBold.widthOfTextAtSize(brandText, 14);
    page.drawText(brandText, {
      x: centerX - brandWidth / 2,
      y: y,
      size: 14,
      font: fontBold,
      color: TEXT_PRIMARY,
    });
    y -= 50;
  }
  
  // Badge: "Internes Framework"
  y -= 50;
  const badgeText = 'INTERNES FRAMEWORK';
  const badgeFontSize = 7;
  const badgeWidth = fontBold.widthOfTextAtSize(badgeText, badgeFontSize);
  const badgePaddingX = 14;
  const badgePaddingY = 5;
  const badgeHeight = 18;
  
  // Badge border
  page.drawRectangle({
    x: centerX - badgeWidth / 2 - badgePaddingX,
    y: y - badgePaddingY,
    width: badgeWidth + badgePaddingX * 2,
    height: badgeHeight,
    borderColor: rgb(45 / 255, 211 / 255, 111 / 255),
    borderWidth: 0.8,
    color: BACKGROUND,
  });
  
  page.drawText(badgeText, {
    x: centerX - badgeWidth / 2,
    y: y,
    size: badgeFontSize,
    font: fontBold,
    color: CALINESS_GREEN,
  });
  
  // Title: "7-Tage Reset"
  y -= 50;
  const titleText = '7-Tage Reset';
  const titleFontSize = 36;
  const titleWidth = fontBold.widthOfTextAtSize(titleText, titleFontSize);
  page.drawText(titleText, {
    x: centerX - titleWidth / 2,
    y: y,
    size: titleFontSize,
    font: fontBold,
    color: TEXT_PRIMARY,
  });
  
  // Subtitle
  y -= 35;
  const subtitle1 = 'Stabilisierung vor Optimierung.';
  const sub1Width = fontRegular.widthOfTextAtSize(subtitle1, 11);
  page.drawText(subtitle1, {
    x: centerX - sub1Width / 2,
    y: y,
    size: 11,
    font: fontRegular,
    color: TEXT_SUBTLE,
  });
  
  y -= 18;
  const subtitle2 = 'Ein strukturierter Ansatz zur Beruhigung des Systems.';
  const sub2Width = fontRegular.widthOfTextAtSize(subtitle2, 11);
  page.drawText(subtitle2, {
    x: centerX - sub2Width / 2,
    y: y,
    size: 11,
    font: fontRegular,
    color: TEXT_SUBTLE,
  });
  
  // Green divider
  y -= 45;
  const dividerWidth = 50;
  page.drawRectangle({
    x: centerX - dividerWidth / 2,
    y: y,
    width: dividerWidth,
    height: 2,
    color: CALINESS_GREEN,
  });
  
  // Bottom notice with logo
  if (logoImage) {
    const footerLogoHeight = 12;
    const footerLogoWidth = (logoImage.width / logoImage.height) * footerLogoHeight;
    page.drawImage(logoImage, {
      x: centerX - footerLogoWidth / 2,
      y: MARGIN_BOTTOM + 6,
      width: footerLogoWidth,
      height: footerLogoHeight,
      opacity: 0.4,
    });
  } else {
    const noticeText = 'CALINESS Academy';
    const noticeWidth = fontRegular.widthOfTextAtSize(noticeText, 7);
    page.drawText(noticeText, {
      x: centerX - noticeWidth / 2,
      y: MARGIN_BOTTOM + 10,
      size: 7,
      font: fontRegular,
      color: TEXT_MUTED,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 2: Einordnung & Alle 5 Säulen (Compact Grid Layout)
// ═══════════════════════════════════════════════════════════════════════════
function drawPage2(page: PDFPage, fontBold: PDFFont, fontRegular: PDFFont, logoImage?: PDFImage) {
  // Fill background - use slightly smaller rectangle to prevent mobile rendering issues
  page.drawRectangle({
    x: 0.5, y: 0.5,
    width: A4_WIDTH - 1, height: A4_HEIGHT - 1,
    color: BACKGROUND,
  });
  
  // Top green accent bar
  page.drawRectangle({
    x: 0,
    y: A4_HEIGHT - 3,
    width: A4_WIDTH,
    height: 3,
    color: CALINESS_GREEN,
  });
  
  let y = A4_HEIGHT - MARGIN_TOP;
  
  // Small header logo
  if (logoImage) {
    const headerLogoHeight = 16;
    const headerLogoWidth = (logoImage.width / logoImage.height) * headerLogoHeight;
    page.drawImage(logoImage, {
      x: MARGIN_LEFT,
      y: y - 4,
      width: headerLogoWidth,
      height: headerLogoHeight,
      opacity: 0.7,
    });
  } else {
    page.drawText('CALINESS ACADEMY', {
      x: MARGIN_LEFT,
      y: y,
      size: 7,
      font: fontBold,
      color: TEXT_MUTED,
    });
  }
  
  // Section: Einordnung
  y -= 30;
  page.drawText('EINORDNUNG', {
    x: MARGIN_LEFT,
    y: y,
    size: 7,
    font: fontBold,
    color: CALINESS_GREEN,
  });
  
  y -= 18;
  page.drawText('Worum es in diesem Reset geht', {
    x: MARGIN_LEFT,
    y: y,
    size: 16,
    font: fontBold,
    color: TEXT_PRIMARY,
  });
  
  y -= 22;
  const introText = 'Dieser Reset ist kein Trainingsplan, keine Challenge und kein Leistungsprogramm. Er dient dazu, dein System zu beruhigen und zu stabilisieren, bevor weitere Schritte folgen. Stabilität ist kein Stillstand – sie ist die Grundlage für langfristige Gesundheit.';
  const introLines = wrapText(introText, fontRegular, 8.5, CONTENT_WIDTH - 20);
  for (const line of introLines) {
    page.drawText(line, { x: MARGIN_LEFT, y: y, size: 8.5, font: fontRegular, color: TEXT_SUBTLE });
    y -= 13;
  }
  
  // Quote block
  y -= 8;
  page.drawLine({
    start: { x: MARGIN_LEFT, y: y + 8 },
    end: { x: MARGIN_LEFT, y: y - 20 },
    thickness: 2,
    color: CALINESS_GREEN,
  });
  
  const quoteText = 'Nicht mehr tun. Sondern das Richtige konstant tun. Sieben Tage mit identischer Struktur schaffen Verlässlichkeit für Körper und Nervensystem.';
  const quoteLines = wrapText(quoteText, fontRegular, 9, CONTENT_WIDTH - 30);
  for (const line of quoteLines) {
    page.drawText(line, { x: MARGIN_LEFT + 14, y: y, size: 9, font: fontRegular, color: TEXT_SECONDARY });
    y -= 14;
  }
  
  // Section: Die fünf Bereiche
  y -= 18;
  page.drawText('DIE FÜNF BEREICHE', {
    x: MARGIN_LEFT,
    y: y,
    size: 7,
    font: fontBold,
    color: CALINESS_GREEN,
  });
  
  y -= 16;
  
  // Helper to draw a pillar card
  const cardWidth = (CONTENT_WIDTH - 10) / 2;
  const cardPadding = 10;
  
  function drawPillarCard(
    x: number, 
    y: number, 
    title: string, 
    content: { label: string; text: string }[],
    note: string,
    width: number,
    height: number
  ) {
    // Card background with border
    page.drawRectangle({
      x: x,
      y: y - height,
      width: width,
      height: height,
      color: CARD_BG,
      borderColor: CARD_BORDER,
      borderWidth: 0.5,
    });
    
    let textY = y - 12;
    
    // Green indicator + title
    page.drawRectangle({
      x: x + 10,
      y: textY - 4,
      width: 3,
      height: 14,
      color: CALINESS_GREEN,
    });
    
    page.drawText(title, {
      x: x + 18,
      y: textY,
      size: 10,
      font: fontBold,
      color: TEXT_PRIMARY,
    });
    
    textY -= 20;
    
    // Content lines
    for (const item of content) {
      const fullText = `${item.label} ${item.text}`;
      const lines = wrapText(fullText, fontRegular, 7.5, width - 26);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Bold the label on first line
        if (i === 0 && line.startsWith(item.label)) {
          page.drawText(item.label, { x: x + 13, y: textY, size: 7.5, font: fontBold, color: TEXT_SECONDARY });
          const labelWidth = fontBold.widthOfTextAtSize(item.label, 7.5);
          page.drawText(line.substring(item.label.length), { x: x + 13 + labelWidth, y: textY, size: 7.5, font: fontRegular, color: TEXT_SECONDARY });
        } else {
          page.drawText(line, { x: x + 13, y: textY, size: 7.5, font: fontRegular, color: TEXT_SECONDARY });
        }
        textY -= 11;
      }
    }
    
    // Note (italic-style, muted)
    if (note) {
      textY -= 2;
      page.drawText(note, { x: x + 13, y: textY, size: 7, font: fontRegular, color: TEXT_MUTED });
    }
  }
  
  // Row 1: Bewegung & Ernährung
  const row1Y = y;
  const cardHeight1 = 72;
  
  drawPillarCard(
    MARGIN_LEFT, row1Y, 'Bewegung',
    [
      { label: 'Ziel:', text: 'Den Körper in einen natürlichen Tagesrhythmus bringen.' },
      { label: 'Handlung:', text: 'Täglich 30 Min ruhige Bewegung. 5.000–7.000 Schritte.' },
    ],
    'Es geht um Rhythmus, nicht um Training.',
    cardWidth, cardHeight1
  );
  
  drawPillarCard(
    MARGIN_LEFT + cardWidth + 10, row1Y, 'Ernährung',
    [
      { label: 'Ziel:', text: 'Blutzucker stabilisieren und die Verdauung entlasten.' },
      { label: 'Handlung:', text: 'Zwei proteinreiche Mahlzeiten pro Tag. Keine Snacks.' },
    ],
    '0,4–0,5g Protein pro kg Körpergewicht pro Mahlzeit.',
    cardWidth, cardHeight1
  );
  
  // Row 2: Regeneration & Mentale Balance
  const row2Y = row1Y - cardHeight1 - 8;
  const cardHeight2 = 95;
  
  drawPillarCard(
    MARGIN_LEFT, row2Y, 'Regeneration',
    [
      { label: 'Ziel:', text: 'Dem Nervensystem Vorhersehbarkeit geben und die nächtliche Regulation unterstützen.' },
      { label: 'Handlung:', text: 'Jeden Tag zur gleichen Zeit ins Bett. Mindestens 8 Stunden im Bett bleiben.' },
      { label: 'Einordnung:', text: 'Stabiler Schlafrhythmus reguliert das autonome Nervensystem (Melatonin, Cortisol).' },
    ],
    'Nicht Schlaf optimieren – Rhythmus stabilisieren.',
    cardWidth, cardHeight2
  );
  
  drawPillarCard(
    MARGIN_LEFT + cardWidth + 10, row2Y, 'Mentale Balance',
    [
      { label: 'Ziel:', text: 'Mentale Daueranspannung reduzieren und kognitive Überlastung abbauen.' },
      { label: 'Handlung:', text: 'Mindestens 30 Min bewusst offline. Kein Bildschirm.' },
      { label: 'Einordnung:', text: 'Phasen ohne Input ermöglichen dem Gehirn, in einen ruhigeren Grundzustand zurückzukehren.' },
    ],
    'Einfach Raum für Ruhe.',
    cardWidth, cardHeight2
  );
  
  // Row 3: Biologische Optimierung (full width)
  const row3Y = row2Y - cardHeight2 - 8;
  const cardHeight3 = 90;
  
  // Full-width card
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: row3Y - cardHeight3,
    width: CONTENT_WIDTH,
    height: cardHeight3,
    color: CARD_BG,
    borderColor: CARD_BORDER,
    borderWidth: 0.5,
  });
  
  let bioY = row3Y - 12;
  
  page.drawRectangle({
    x: MARGIN_LEFT + 10,
    y: bioY - 4,
    width: 3,
    height: 14,
    color: CALINESS_GREEN,
  });
  
  page.drawText('Biologische Optimierung', {
    x: MARGIN_LEFT + 18,
    y: bioY,
    size: 10,
    font: fontBold,
    color: TEXT_PRIMARY,
  });
  
  bioY -= 18;
  
  const bioContent = [
    { label: 'Ziel:', text: 'Natürliche Regulationsprozesse entlasten und interne Balance unterstützen.' },
    { label: 'Handlung:', text: 'Für diese sieben Tage bewusst auf Alkohol verzichten. Zusätzlich: Keine neuen Routinen, Maßnahmen oder Interventionen beginnen.' },
    { label: 'Einordnung:', text: 'Alkohol beeinflusst Schlafarchitektur, Blutzuckerregulation und entzündliche Prozesse. Eine temporäre Pause reduziert systemische Belastung.' },
  ];
  
  for (const item of bioContent) {
    const fullText = `${item.label} ${item.text}`;
    const lines = wrapText(fullText, fontRegular, 7.5, CONTENT_WIDTH - 30);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (i === 0 && line.startsWith(item.label)) {
        page.drawText(item.label, { x: MARGIN_LEFT + 13, y: bioY, size: 7.5, font: fontBold, color: TEXT_SECONDARY });
        const labelWidth = fontBold.widthOfTextAtSize(item.label, 7.5);
        page.drawText(line.substring(item.label.length), { x: MARGIN_LEFT + 13 + labelWidth, y: bioY, size: 7.5, font: fontRegular, color: TEXT_SECONDARY });
      } else {
        page.drawText(line, { x: MARGIN_LEFT + 13, y: bioY, size: 7.5, font: fontRegular, color: TEXT_SECONDARY });
      }
      bioY -= 11;
    }
  }
  
  bioY -= 2;
  page.drawText('Diese Phase dient der Beruhigung – nicht der Veränderung.', {
    x: MARGIN_LEFT + 13,
    y: bioY,
    size: 7,
    font: fontRegular,
    color: TEXT_MUTED,
  });
  
  drawFooter(page, fontBold, fontRegular, 2, logoImage);
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 3: 7-Tage Reset – Protokoll (Interactive Checkboxes)
// ═══════════════════════════════════════════════════════════════════════════
function drawPage3(page: PDFPage, fontBold: PDFFont, fontRegular: PDFFont, form: ReturnType<PDFDocument['getForm']>, logoImage?: PDFImage) {
  // Fill background - use slightly smaller rectangle to prevent mobile rendering issues
  page.drawRectangle({
    x: 0.5, y: 0.5,
    width: A4_WIDTH - 1, height: A4_HEIGHT - 1,
    color: BACKGROUND,
  });
  
  // Top green accent bar
  page.drawRectangle({
    x: 0,
    y: A4_HEIGHT - 3,
    width: A4_WIDTH,
    height: 3,
    color: CALINESS_GREEN,
  });
  
  let y = A4_HEIGHT - MARGIN_TOP;
  
  // Small header logo
  if (logoImage) {
    const headerLogoHeight = 16;
    const headerLogoWidth = (logoImage.width / logoImage.height) * headerLogoHeight;
    page.drawImage(logoImage, {
      x: MARGIN_LEFT,
      y: y - 4,
      width: headerLogoWidth,
      height: headerLogoHeight,
      opacity: 0.7,
    });
  } else {
    page.drawText('CALINESS ACADEMY', {
      x: MARGIN_LEFT,
      y: y,
      size: 7,
      font: fontBold,
      color: TEXT_MUTED,
    });
  }
  
  // Protocol title
  y -= 28;
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: y - 2,
    width: 3,
    height: 16,
    color: CALINESS_GREEN,
  });
  
  page.drawText('7-Tage Reset – Protokoll', {
    x: MARGIN_LEFT + 12,
    y: y,
    size: 13,
    font: fontBold,
    color: TEXT_PRIMARY,
  });
  
  // Protocol Grid
  y -= 32;
  const gridStartY = y;
  const habitColumnWidth = 150;
  const dayColumnWidth = (CONTENT_WIDTH - habitColumnWidth) / 7;
  const headerRowHeight = 20;
  const rowHeight = 24;
  
  // Header background
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: gridStartY - headerRowHeight,
    width: CONTENT_WIDTH,
    height: headerRowHeight,
    color: CARD_BG,
  });
  
  // Day headers
  for (let i = 0; i < DAYS.length; i++) {
    const dayX = MARGIN_LEFT + habitColumnWidth + (i * dayColumnWidth) + (dayColumnWidth / 2);
    const dayWidth = fontBold.widthOfTextAtSize(DAYS[i], 6.5);
    page.drawText(DAYS[i], {
      x: dayX - dayWidth / 2,
      y: gridStartY - headerRowHeight + 6,
      size: 6.5,
      font: fontBold,
      color: TEXT_MUTED,
    });
  }
  
  // Header separator
  page.drawLine({
    start: { x: MARGIN_LEFT, y: gridStartY - headerRowHeight },
    end: { x: A4_WIDTH - MARGIN_RIGHT, y: gridStartY - headerRowHeight },
    thickness: 0.3,
    color: LINE_COLOR,
  });
  
  // Draw habits and checkboxes
  for (let habitIndex = 0; habitIndex < HABITS.length; habitIndex++) {
    const habitY = gridStartY - headerRowHeight - (habitIndex * rowHeight) - (rowHeight / 2);
    
    // Habit text
    page.drawText(HABITS[habitIndex], {
      x: MARGIN_LEFT + 10,
      y: habitY - 3,
      size: 7.5,
      font: fontRegular,
      color: TEXT_SECONDARY,
    });
    
    // Row separator
    if (habitIndex < HABITS.length - 1) {
      const lineY = gridStartY - headerRowHeight - ((habitIndex + 1) * rowHeight);
      page.drawLine({
        start: { x: MARGIN_LEFT, y: lineY },
        end: { x: A4_WIDTH - MARGIN_RIGHT, y: lineY },
        thickness: 0.2,
        color: LINE_COLOR,
      });
    }
    
    // Checkboxes for each day
    for (let dayIndex = 0; dayIndex < DAYS.length; dayIndex++) {
      const checkboxSize = 13;
      const checkboxX = MARGIN_LEFT + habitColumnWidth + (dayIndex * dayColumnWidth) + (dayColumnWidth / 2) - (checkboxSize / 2);
      const checkboxY = habitY - (checkboxSize / 2);
      
      const fieldName = `protocol.d${dayIndex + 1}.h${habitIndex + 1}`;
      
      const checkbox = form.createCheckBox(fieldName);
      checkbox.addToPage(page, {
        x: checkboxX,
        y: checkboxY,
        width: checkboxSize,
        height: checkboxSize,
        borderWidth: 1.5,
        borderColor: CALINESS_GREEN,
        backgroundColor: CHECKBOX_BG,
        textColor: CALINESS_GREEN,
      });
      
      if (typeof checkbox?.defaultUpdateAppearances === 'function') {
        checkbox.defaultUpdateAppearances();
      }
    }
  }
  
  // Grid bottom border
  const gridEndY = gridStartY - headerRowHeight - (HABITS.length * rowHeight);
  page.drawLine({
    start: { x: MARGIN_LEFT, y: gridEndY },
    end: { x: A4_WIDTH - MARGIN_RIGHT, y: gridEndY },
    thickness: 0.3,
    color: LINE_COLOR,
  });
  
  // Priority Box
  y = gridEndY - 18;
  const priorityBoxHeight = 72;
  
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: y - priorityBoxHeight,
    width: CONTENT_WIDTH,
    height: priorityBoxHeight,
    color: GREEN_SUBTLE_BG,
    borderColor: rgb(20 / 255, 60 / 255, 35 / 255),
    borderWidth: 0.5,
  });
  
  let prioY = y - 14;
  page.drawText('Priorisierung bei stressigen Tagen', {
    x: MARGIN_LEFT + 14,
    y: prioY,
    size: 8.5,
    font: fontBold,
    color: CALINESS_GREEN,
  });
  
  prioY -= 16;
  const priorities = [
    '1.  Schlafrhythmus einhalten',
    '2.  Zwei proteinreiche Mahlzeiten',
    '3.  Reize reduzieren',
  ];
  for (const p of priorities) {
    page.drawText(p, { x: MARGIN_LEFT + 14, y: prioY, size: 8, font: fontRegular, color: TEXT_SECONDARY });
    prioY -= 12;
  }
  
  prioY -= 4;
  page.drawText('Stabilität entsteht durch Entlastung, nicht durch Perfektion.', {
    x: MARGIN_LEFT + 14,
    y: prioY,
    size: 7.5,
    font: fontRegular,
    color: TEXT_MUTED,
  });
  
  // Check-in Section
  y = y - priorityBoxHeight - 16;
  const checkinHeight = 90;
  
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: y - checkinHeight,
    width: CONTENT_WIDTH,
    height: checkinHeight,
    color: CARD_BG,
    borderColor: CARD_BORDER,
    borderWidth: 0.5,
  });
  
  let checkY = y - 14;
  page.drawText('Tag-7 Check-in', {
    x: MARGIN_LEFT + 14,
    y: checkY,
    size: 9,
    font: fontBold,
    color: TEXT_PRIMARY,
  });
  
  checkY -= 20;
  const checkInItems = ['Energie', 'Schlafqualität', 'Innere Ruhe'];
  const checkboxSizeSmall = 11;
  
  for (const item of checkInItems) {
    page.drawText(item, { x: MARGIN_LEFT + 14, y: checkY, size: 8, font: fontRegular, color: TEXT_SECONDARY });
    
    // 5 rating checkboxes
    for (let i = 1; i <= 5; i++) {
      const cbX = MARGIN_LEFT + 110 + (i - 1) * 28;
      
      // Number label above checkbox
      page.drawText(String(i), {
        x: cbX + checkboxSizeSmall / 2 - 2,
        y: checkY + 11,
        size: 6.5,
        font: fontRegular,
        color: TEXT_MUTED,
      });
      
      const fieldName = `checkin.${item.toLowerCase().replace(/ä/g, 'ae').replace(/[^a-z]/g, '')}.${i}`;
      const cb = form.createCheckBox(fieldName);
      cb.addToPage(page, {
        x: cbX,
        y: checkY - 3,
        width: checkboxSizeSmall,
        height: checkboxSizeSmall,
        borderWidth: 1.5,
        borderColor: CALINESS_GREEN,
        backgroundColor: CHECKBOX_BG,
        textColor: CALINESS_GREEN,
      });
      
      if (typeof cb?.defaultUpdateAppearances === 'function') {
        cb.defaultUpdateAppearances();
      }
    }
    
    checkY -= 22;
  }
  
  // Decision Section
  y = y - checkinHeight - 14;
  page.drawText('Entscheidung:', { x: MARGIN_LEFT, y: y, size: 8.5, font: fontBold, color: TEXT_PRIMARY });
  
  y -= 18;
  const decisions = [
    'Reset für weitere 7 Tage fortsetzen',
    'Übergang in den nächsten Schritt',
  ];
  
  for (let i = 0; i < decisions.length; i++) {
    const cb = form.createCheckBox(`decision.${i + 1}`);
    cb.addToPage(page, {
      x: MARGIN_LEFT,
      y: y - 2,
      width: checkboxSizeSmall,
      height: checkboxSizeSmall,
      borderWidth: 1.5,
      borderColor: CALINESS_GREEN,
      backgroundColor: CHECKBOX_BG,
      textColor: CALINESS_GREEN,
    });
    
    if (typeof cb?.defaultUpdateAppearances === 'function') {
      cb.defaultUpdateAppearances();
    }
    
    page.drawText(decisions[i], { x: MARGIN_LEFT + 18, y: y, size: 8, font: fontRegular, color: TEXT_SECONDARY });
    y -= 18;
  }
  
  // Closing note
  y -= 12;
  page.drawLine({
    start: { x: MARGIN_LEFT, y: y + 8 },
    end: { x: MARGIN_LEFT + 60, y: y + 8 },
    thickness: 0.3,
    color: LINE_COLOR,
  });
  
  page.drawText('Langfristige Gesundheit entsteht nicht durch Tempo, sondern durch klare, ruhige Richtung.', {
    x: MARGIN_LEFT,
    y: y - 6,
    size: 8,
    font: fontRegular,
    color: TEXT_MUTED,
  });
  
  drawFooter(page, fontBold, fontRegular, 3, logoImage);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT: Generate the complete PDF
// ═══════════════════════════════════════════════════════════════════════════
export async function generateResetPdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  // Embed standard fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Load and embed logo
  let logoImage: PDFImage | undefined;
  try {
    const logoResponse = await fetch(LOGO_URL);
    if (logoResponse.ok) {
      const logoBytes = await logoResponse.arrayBuffer();
      logoImage = await pdfDoc.embedPng(new Uint8Array(logoBytes));
    }
  } catch (e) {
    console.warn('Could not load logo for PDF:', e);
  }
  
  // Create pages
  const page1 = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  const page2 = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  const page3 = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  
  // Get form for interactive checkboxes
  const form = pdfDoc.getForm();
  
  // Set NeedAppearances for maximum reader compatibility
  try {
    form?.acroForm?.dict?.set?.(PDFName.of('NeedAppearances'), PDFBool.True);
  } catch {
    // best-effort
  }
  
  // Draw pages with logo
  drawPage1(page1, fontBold, fontRegular, logoImage);
  drawPage2(page2, fontBold, fontRegular, logoImage);
  drawPage3(page3, fontBold, fontRegular, form, logoImage);
  
  // Update field appearances for non-Adobe viewers
  if (typeof form?.updateFieldAppearances === 'function') {
    form.updateFieldAppearances(fontRegular);
  }
  
  // Save with maximum mobile compatibility settings
  return await pdfDoc.save({
    updateFieldAppearances: true,
    useObjectStreams: false,
    addDefaultPage: false,
  });
}

export function downloadPdf(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
