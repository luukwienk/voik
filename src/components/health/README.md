# Health Tracking Components

Deze map bevat componenten voor de gezondheids-tracking functionaliteit van de app. Hiermee kun je gewicht, calorie-inname, taille en training bijhouden.

## Componenten

### HealthTabNavigator

Het hoofdcomponent dat een moderne tab-navigatie biedt voor invoer en statistieken van gezondheidsdata.

#### Features:
- Invoerscherm voor dagelijkse gezondheidsmetingen
- Statistieken en grafieken van je voortgang
- Responsive design voor desktop en mobiel

#### Props:
- `healthData`: Array van gezondheidsdata uit de database
- `healthLoading`: Boolean die aangeeft of de data wordt geladen
- `addHealthEntry`: Functie om een nieuwe invoer toe te voegen
- `updateHealthEntry`: Functie om een bestaande invoer te wijzigen
- `deleteHealthEntry`: Functie om een invoer te verwijderen
- `getHealthDataByDateRange`: Functie om data te filteren op datum
- `getLatestEntry`: Functie om de meest recente invoer op te halen
- `calculateWeeklyAverage`: Functie om gemiddelden te berekenen
- `calculateTrend`: Functie om trends te berekenen

## Data structuur

Elke gezondheidsinvoer heeft deze structuur:

```javascript
{
  id: string,           // Unieke identifier
  date: Date,           // Datum van de invoer
  weight: number,       // Gewicht in kg (optioneel)
  calories: number,     // Calorie-inname (optioneel)
  waist: number,        // Taille in cm (optioneel)
  workout: number,      // Training in minuten (optioneel)
  createdAt: Date,      // Aanmaakdatum
  updatedAt: Date,      // Laatst bijgewerkt
  userId: string        // ID van de gebruiker
}
```

## Gebruik

```jsx
import HealthTabNavigator from './components/health/HealthTabNavigator';
import { useHealthTracking } from './hooks/useHealthTracking';

function HealthTrackingPage({ user }) {
  const { 
    healthData,
    healthLoading,
    addHealthEntry,
    updateHealthEntry,
    deleteHealthEntry,
    getHealthDataByDateRange,
    getLatestEntry,
    calculateWeeklyAverage,
    calculateTrend
  } = useHealthTracking(user);

  return (
    <HealthTabNavigator
      healthData={healthData}
      healthLoading={healthLoading}
      addHealthEntry={addHealthEntry}
      updateHealthEntry={updateHealthEntry}
      deleteHealthEntry={deleteHealthEntry}
      getHealthDataByDateRange={getHealthDataByDateRange}
      getLatestEntry={getLatestEntry}
      calculateWeeklyAverage={calculateWeeklyAverage}
      calculateTrend={calculateTrend}
    />
  );
}
```

## Toekomstige uitbreidingen

- Meer analyses en inzichten (BMI, calorie-doelen, etc.)
- Doelen instellen en voortgang volgen
- Extra metingen toevoegen (vetpercentage, bloeddruk, etc.)
- Exportfunctie voor gezondheidsdata
- Integratie met fitness apps/devices

## Afhankelijkheden

- React voor de UI
- Recharts voor grafieken
- Firebase/Firestore voor dataopslag