# Voik Meet Transcriber - Chrome Extension

Chrome Extension voor het opnemen van Google Meet audio en transcriberen via de Voik webapp.

## Features

- **Tab Audio Capture**: Neemt audio op van andere Meet deelnemers
- **Microfoon Capture**: Neemt je eigen stem op
- **Audio Mixing**: Combineert beide bronnen tot één opname
- **Voik Integratie**: Directe upload naar Voik voor transcriptie
- **Onzichtbaar**: Geen indicatie voor andere deelnemers (geen bot, geen "scherm delen")

## Installatie

### 1. Extension Icons Genereren

Open `icons/generate-icons.html` in een browser en download de drie icon bestanden:
- `icon16.png`
- `icon48.png`
- `icon128.png`

Sla deze op in de `icons/` folder.

### 2. Extension Laden in Chrome

1. Open Chrome en ga naar `chrome://extensions/`
2. Zet **Developer mode** aan (toggle rechtsboven)
3. Klik op **Load unpacked**
4. Selecteer de `meet-transcriber-extension` folder
5. De extension verschijnt in je toolbar

### 3. Voik Webapp URL Configureren

Open `popup.js` en pas de `getVoikUrl()` functie aan:

```javascript
function getVoikUrl() {
  // Voor lokale development:
  return 'http://localhost:3000';

  // Voor productie:
  // return 'https://jouw-voik-domein.com';
}
```

## Gebruik

### Opname Starten

1. Ga naar een Google Meet meeting
2. Klik op de Voik extension icon in je toolbar
3. Selecteer welke audiobronnen je wilt opnemen:
   - **Tab audio**: Stemmen van andere deelnemers
   - **Microfoon**: Je eigen stem
4. Klik op **Start Opname**
5. Geef toestemming voor audio capture wanneer Chrome hierom vraagt

### Opname Stoppen

1. Klik op **Stop Opname**
2. Je kunt de opname previewen met de **Preview** knop
3. Kies een van de volgende acties:
   - **Open in Voik**: Upload naar Voik voor transcriptie
   - **Download**: Sla op als lokaal .webm bestand
   - **Verwijder**: Gooi de opname weg

### Transcriptie in Voik

Na het klikken op "Open in Voik":
1. De Voik webapp opent automatisch
2. Een import dialoog verschijnt met de opname details
3. Pas de titel en tags aan indien gewenst
4. Klik op **Upload & Transcribeer**
5. De transcriptie wordt op de achtergrond verwerkt

## Technische Details

### Bestandsstructuur

```
meet-transcriber-extension/
├── manifest.json          # Extension configuratie (Manifest V3)
├── background.js          # Service worker voor state management
├── offscreen.html/js      # Audio capture en mixing
├── content.js             # Google Meet pagina integratie
├── popup.html/js/css      # Extension popup UI
├── icons/                 # Extension icons
└── README.md              # Deze documentatie
```

### Permissions

- `tabCapture`: Capture audio van de Meet tab
- `activeTab`: Toegang tot huidige tab info
- `scripting`: Content script injectie
- `storage`: Opslaan van voorkeuren en audio data
- `offscreen`: Offscreen document voor audio processing

### Audio Formaat

- **MIME Type**: `audio/webm;codecs=opus`
- **Sample Rate**: 44100 Hz
- **Bitrate**: 128 kbps

### Beperkingen

- Werkt alleen op `meet.google.com` pagina's
- Vereist Chrome browser (geen Firefox/Safari support)
- Audio wordt tijdelijk in browser storage opgeslagen (max 1 uur)
- Grote opnames (>1 uur) kunnen browser geheugen belasten

## Troubleshooting

### "Kon tab audio niet capturen"

- Zorg dat je op de Meet tab bent wanneer je de opname start
- Herlaad de Meet pagina en probeer opnieuw
- Check of je Chrome toestemming hebt gegeven voor audio capture

### "Kon microfoon niet openen"

- Check browser permissions voor microfoon toegang
- Zorg dat geen andere applicatie de microfoon gebruikt
- Herstart Chrome indien nodig

### "Geen audio gevonden" in Voik

- De audio data is mogelijk verlopen (ouder dan 1 uur)
- Maak een nieuwe opname en probeer direct te uploaden

### Extension werkt niet na update

1. Ga naar `chrome://extensions/`
2. Klik op het refresh icoon bij de extension
3. Herlaad de Google Meet pagina

## Privacy & Veiligheid

- Audio wordt lokaal verwerkt in je browser
- Data wordt alleen naar Voik verstuurd na expliciete actie
- Geen tracking of analytics in de extension
- Opnames worden na upload verwijderd uit browser storage

## Development

### Debuggen

1. Open `chrome://extensions/`
2. Klik op "Service worker" link bij de extension
3. DevTools opent voor background script debugging
4. Voor popup debugging: rechtermuisklik op popup → Inspect

### Logs

De extension logt naar de console met `[Voik]` prefix:
- `[Voik BG]` - Background script
- `[Voik Offscreen]` - Audio capture
- `[Voik Content]` - Content script
- `[Voik]` - Popup

## Licentie

Onderdeel van het Voik project. Alle rechten voorbehouden.
