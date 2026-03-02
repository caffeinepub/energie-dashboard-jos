# Energie Dashboard Jos

## Current State
Een energie dashboard applicatie met Internet Identity authenticatie. Gebruikers kunnen meterstanden invoeren, kosten berekenen en grafieken/analyses bekijken. De applicatie heeft problemen met layout, kleurenschema en inconsistenties in de data flow.

## Requested Changes (Diff)

### Add
- Volledige heropbouw van de applicatie van de grond af aan
- Locatie-instelling voor weerdata (stad/coördinaten)
- HTTP outcalls naar Open-Meteo API voor live weerdata (temperatuur, luchtvochtigheid, neerslag per maand)
- Weerdata correlatie-analyses: verbruik vs. temperatuur grafieken
- Heatmap: verbruik per dag gerelateerd aan temperatuur
- Seizoensanalyse: zomer vs. winter verbruik
- Kosten-per-graaddag analyse (heating degree days)
- Professionele sidebar navigatie layout
- Dashboard overzichts-pagina met KPI cards
- Jaar-selector persistent door de app
- "Instellingen" pagina voor profiel, locatie, prijzen en belastingen

### Modify
- Backend: voeg locatie opslag toe per gebruiker
- Backend: voeg weather data caching toe (maandgemiddelden per locatie)
- Backend: HTTP outcalls naar Open-Meteo voor historische weerdata
- Frontend: volledig herontwerpte professionele UI
- Alle bestaande data types behouden (Entry, MeterReadings, YearlyPrices, YearlyTax, etc.)
- Verbruiksberekening via meterstand-deltas blijft behouden
- Elektriciteit normaal/dal splitsing blijft behouden

### Remove
- Oude component-gebaseerde frontend (volledig vervangen)
- Gebroken styling en inconsistenties

## Implementation Plan

### Backend (Motoko)
1. Behoud alle bestaande types: Entry, MeterReadings, YearlyPrices, YearlyTax, UserProfile, YearlyStartingReadings, GlobalMeterReadings
2. Voeg `UserLocation` type toe: { city: Text; latitude: Float; longitude: Float }
3. Voeg `WeatherData` type toe: { month: Nat8; year: Nat16; avgTempC: Float; humidity: Float; precipitation: Float }
4. Voeg `userLocations` map toe per Principal
5. Voeg `cachedWeatherData` map toe per Principal per jaar-maand sleutel
6. HTTP outcall naar Open-Meteo API: `https://api.open-meteo.com/v1/forecast` en historical endpoint
7. Functies: setUserLocation, getUserLocation, fetchWeatherForMonth, getWeatherData, getCachedWeatherData
8. Behoud alle bestaande CRUD functies

### Frontend
1. Layout: sidebar navigatie (links) + main content area
2. Pagina's: Dashboard, Data Invoer, Grafieken, Analyse, Vergelijking, Instellingen
3. Dashboard: KPI cards (huidig maandverbruik, kosten, prognose), mini grafieken, actueel weer widget
4. Data Invoer: meterstanden per maand, beginstanden per jaar, overige kosten, prijs aanpassingen per maand
5. Grafieken: verbruik bar chart, kostengrafiek, verbruik vs. temperatuur scatter plot, cumulatief
6. Analyse: uitgebreide statistieken, seizoensanalyse, correlatie verbruik/temperatuur
7. Vergelijking: jaar-op-jaar vergelijking met weerdata context
8. Instellingen: profielbeheer, locatie instelling, jaarlijkse prijzen & belastingen
