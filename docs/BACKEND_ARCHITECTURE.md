# CALINESS Backend-Architektur

Vollständige Dokumentation des Datenmodells, der Business-Logik und Backend-Flows.

---

## Tabellenübersicht

| Tabelle | Zweck | RLS |
|---------|-------|-----|
| `user_profiles` | Profil, Premium, Rolle | SELECT/INSERT/UPDATE own |
| `daily_checkins` | Tägliche Check-ins | SELECT/INSERT/UPDATE own |
| `score_history` | Longevity Score pro Tag | SELECT/INSERT/UPDATE own |
| `goal_plans` | Zielsystem + Pläne | SELECT/INSERT/UPDATE/DELETE own |
| `nutrition_logs` | Mahlzeiten-Tracking | SELECT/INSERT/UPDATE own |
| `weight_entries` | Gewichtsverlauf | SELECT/INSERT/UPDATE own |
| `wearable_entries` | Wearable-Daten | SELECT/INSERT/UPDATE own |
| `habit_data` | Gewohnheiten (JSON) | SELECT/INSERT/UPDATE own |
| `coach_sessions` | AI Coach Chat + Memory | SELECT/INSERT/UPDATE own |
| `companion_evolution` | Companion State | SELECT/INSERT/UPDATE own |
| `weekly_reports` | Wochenberichte | SELECT/INSERT/UPDATE own |
| `activity_logs` | Aktivitäts-Tracking | SELECT/INSERT/DELETE own |
| `badges` | Errungenschaften | SELECT/INSERT own |
| `training_logs` | Workout-Protokolle | SELECT/INSERT/DELETE own |
| `admin_access` | Admin-Passwort | Kein public access |
| `admin_sessions` | Admin-Sessions | Kein public access |
| `bio_age_results` | BioAge Ergebnisse | Public INSERT, no read |
| `bioage_submissions` | BioAge Submissions | Public INSERT, no read |
| `brevo_sync_failures` | E-Mail Sync Fehler | Service role only |

## Unique Constraints (für Upserts)

- `daily_checkins(user_id, date)`
- `score_history(user_id, date)`
- `weight_entries(user_id, date)`
- `wearable_entries(user_id, date)`
- `badges(user_id, badge_id)`

## Auth / Profile / Roles

- `auth.users` → Supabase Auth (email, password)
- `user_profiles.id = auth.uid()` → 1:1 Beziehung
- Premium: `is_premium`, `premium_source` (none|stripe|manual|beta|founder|developer), `premium_until`
- Rolle: `role` (user|admin|tester|founding_member)
- Premium-Check: `check-subscription` Edge Function (Stripe + manual sources)

## Business-Logik

### Longevity Score
```
PillarScores = calculatePillarScores(checkIn) → {bewegung, ernaehrung, regeneration, mental} 0-100
LongevityScore = Ø(4 Pillars)
RollingScore = 7-Tage gewichtet (heute=40%, gestern=18%, ...)
```

### Companion Evolution
```
Tiers: seed(0) → sprout(25) → sapling(45) → guardian(65) → ancient(85)
Evolution = vitality*0.6 + consistency*0.25 + streak*0.15
```

### Goal Assessment
```
7 Zieltypen → Pillar Assessment → Realism Check → Weekly Plan
Kalorien: Mifflin-St Jeor BMR × Aktivitätsfaktor ± Defizit/Überschuss
Protein: 1.6-2.2g/kg je Zieltyp
```

## Edge Functions

| Funktion | AI-abhängig | API Keys |
|----------|-------------|----------|
| check-subscription | Nein | STRIPE_SECRET_KEY |
| create-checkout | Nein | STRIPE_SECRET_KEY |
| customer-portal | Nein | STRIPE_SECRET_KEY |
| admin-auth | Nein | — |
| admin-data | Nein | — |
| admin-users | Nein | — |
| longevity-coach | **Ja** | LOVABLE_API_KEY |
| generate-plan | **Ja** | LOVABLE_API_KEY |
| goal-planner | **Ja** | LOVABLE_API_KEY |
| nutrition-ai | **Ja** | LOVABLE_API_KEY |
| weekly-report | **Ja** | LOVABLE_API_KEY |
| visualizer-ai | **Ja** | LOVABLE_API_KEY |
| bestform-ai | **Ja** | LOVABLE_API_KEY |
| generate-health-tips | **Ja** | LOVABLE_API_KEY |
| send-bioage-email | Nein | BREVO_API_KEY |
| sync-brevo | Nein | BREVO_API_KEY |
| download-pdf | Nein | — |

## Migrationskritische Punkte

1. **LOVABLE_API_KEY** → Bei Migration durch OpenAI/Anthropic ersetzen
2. **ai.gateway.lovable.dev** → Durch direkten Provider-Endpoint ersetzen
3. **Admin Dual-Auth** → Könnte auf Supabase Auth + role vereinfacht werden
4. **goal_plans.weekly_plan JSON** → Daten jetzt in eigenen Spalten (active_pillars, nutrition_plan, etc.)
