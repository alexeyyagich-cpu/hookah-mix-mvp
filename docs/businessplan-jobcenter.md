# BUSINESSPLAN

## Hookah Torus — B2B SaaS-Plattform für Shisha-Bar-Management

**Gründer:** Oleksii Iagich
**Datum:** Februar 2026
**Rechtsform:** Einzelunternehmen (geplant: UG haftungsbeschränkt)
**Standort:** Deutschland
**Website:** https://hookahtorus.com

---

## 1. Zusammenfassung (Executive Summary)

**Hookah Torus** ist eine cloudbasierte B2B-Software (SaaS) zur Verwaltung von Shisha-Bars und Hookah-Lounges. Die Plattform bietet Bestandsverwaltung (Tabak nach Gramm), Rezeptverwaltung für Tabakmischungen, Sitzungserfassung, Gästemanagement, Tischplanung und Integration mit dem POS-System ready2order.

**Das Problem:** Es gibt ca. 4.000–5.000 Shisha-Bars in Deutschland. Keine davon hat eine branchenspezifische Software. Sie nutzen entweder Excel-Tabellen für die Tabakbestandsverwaltung oder gar nichts. Generische POS-Systeme (ready2order, orderbird) können nicht den Tabakverbrauch pro Gramm nachverfolgen, Rezepturen verwalten oder die Kosten pro Sitzung berechnen.

**Die Lösung:** Hookah Torus schließt diese Lücke als einzige spezialisierte Software mit POS-Integration in Deutschland. Das Produkt ist bereits vollständig entwickelt und unter https://hookahtorus.com live verfügbar.

**Umsatzmodell:**
1. **SaaS-Abonnements** (€29–79/Monat pro Bar)
2. **Marktplatz-Provisionen** (8–15% auf Tabakbestellungen über die Plattform)

**Ziel Jahr 1:** 50 zahlende Bars, MRR €2.000+, erste Marktplatz-Umsätze

---

## 2. Gründerprofil

**Name:** Oleksii Iagich
**Qualifikation:** Software-Entwickler mit Erfahrung in Full-Stack-Webentwicklung (Next.js, React, TypeScript, Supabase, Cloud-Infrastruktur)

**Fachliche Eignung:**
- Eigenständige Entwicklung der gesamten Plattform (Frontend, Backend, Datenbank, Deployment)
- Kenntnisse in SaaS-Geschäftsmodellen, API-Integrationen, Zahlungsabwicklung (Stripe)
- Branchenkenntnisse im Shisha-Bar-Segment

**Persönliche Eignung:**
- Selbstständige Arbeitsweise, nachgewiesen durch die eigenständige Produktentwicklung
- Erfahrung mit Kundenkommunikation und B2B-Vertrieb
- Motivation: Identifizierte Marktlücke in einem wachsenden Markt

---

## 3. Geschäftsidee

### 3.1 Produkt

Hookah Torus ist eine webbasierte Plattform (PWA — Progressive Web App), die folgende Module bietet:

| Modul | Beschreibung |
|---|---|
| **Tabak-Bestandsverwaltung** | Erfassung nach Gramm, automatische Bestandsaktualisierung, Warnungen bei niedrigem Bestand |
| **Mischungsrechner** | Rezepte erstellen, Kompatibilität bewerten, Kosten pro Sitzung berechnen |
| **Sitzungserfassung** | Jede Hookah-Sitzung mit Tabakverbrauch, Bewertung, Dauer dokumentieren |
| **Gästemanagement** | Stammgäste mit Präferenzen speichern, letzte Mischung wiederholen |
| **Tischplan** | Drag-and-Drop Raumplanung, Tischstatus in Echtzeit |
| **POS-Integration** | Anbindung an ready2order: Produktsynchronisation, Verkaufsdaten, Bestandsabgleich |
| **Marktplatz** | Tabak direkt bei Großhändlern bestellen, automatische Nachbestellung |
| **Reservierungen** | Online-Buchung, Kalenderansicht |
| **Bewertungen** | Gästebewertungen sammeln und verwalten |
| **Team-Verwaltung** | Mitarbeiter einladen, Rollen zuweisen |

### 3.2 Alleinstellungsmerkmal (USP)

1. **Einzige branchenspezifische Software in Deutschland** — kein Wettbewerber bietet eine hookah-spezifische Lösung im DACH-Raum
2. **POS-Integration mit ready2order** — dem führenden Kassensystem für Gastronomie in Deutschland/Österreich
3. **Tabakverbrauch auf Gramm-Ebene** — kein generisches POS kann dies
4. **Marktplatz** — Software + Handel = hoher Lock-in-Effekt
5. **TSE-konform** über ready2order-Integration

### 3.3 Technologie

- **Frontend:** Next.js 16 (React), TypeScript
- **Backend:** Supabase (PostgreSQL, Authentication, Row Level Security)
- **Hosting:** Vercel (serverless, automatische Skalierung)
- **Zahlungen:** Stripe
- **POS:** ready2order API (OAuth, Webhooks)
- **Betriebskosten:** Minimal (~€50/Monat für Infrastruktur)

---

## 4. Marktanalyse

### 4.1 Zielmarkt

**Primärmarkt:** Shisha-Bars und Hookah-Lounges in Deutschland
**Sekundärmarkt:** DACH-Region (Österreich, Schweiz), dann europaweit

| Kennzahl | Wert |
|---|---|
| Anzahl Shisha-Bars in Deutschland | ca. 4.000–5.000 |
| Anzahl Shisha-Bars DACH | ca. 5.500–7.000 |
| Durchschnittliche monatliche Tabakausgaben pro Bar | €1.500–3.000 |
| Durchschnittliche monatliche Software/POS-Ausgaben | €22–99 |
| Globaler Shisha-Tabakmarkt | $4,2 Mrd. (2025) → $6,1 Mrd. (2033) |
| Europa-Anteil | ~28% des globalen Marktes |

**Regionale Verteilung in Deutschland:**
- Nordrhein-Westfalen (höchste Konzentration)
- Berlin (~400 Bars)
- Bayern, Baden-Württemberg, Hessen

### 4.2 Zielgruppe

- **Eigentümer/Betreiber** von Shisha-Bars (Einzelstandort oder kleine Ketten)
- **Alter:** 25–45 Jahre
- **Schmerzpunkte:** Tabakbestandsführung, Kostenkontrolle, Steuerkonformität
- **Kaufkraft:** Bereits €22–99/Monat für POS-Systeme, bereit für Fachlösungen

### 4.3 Wettbewerbsanalyse

#### Generische POS-Systeme (indirekte Konkurrenz)

| Wettbewerber | Preis/Monat | TSE | Hookah-Funktionen |
|---|---|---|---|
| ready2order | €7,90–€22,90 | Ja | Keine |
| orderbird | €49 + TSE €139/Jahr | Ja | Keine |
| Lightspeed | ab €69 (real €300–800) | Ja | Keine |
| SumUp POS | ab €99 | Ja | Keine |

#### Hookah-spezifische Software (direkte Konkurrenz)

| Wettbewerber | Preis/Monat | Markt | POS | Inventar | Mischungen | Marktplatz |
|---|---|---|---|---|---|---|
| Kavapp | individuell | GUS-Raum | Ja | Ja | Nein | Nein |
| SkyService POS | $17–43 | GUS-Raum | Ja | Basic | Nein | Nein |
| HookahPlus | 3 Tarife (verborgen) | USA | Square/Clover | Nein | Ja | Nein |
| Bepoz | Abo (verborgen) | USA | Ja | Basic | Nein | Nein |
| **Hookah Torus** | **€0–79** | **DACH → Global** | **ready2order** | **Ja (Gramm)** | **Ja + KI** | **Ja** |

**Ergebnis:** Kein Wettbewerber ist im deutschen Markt aktiv. Hookah Torus ist die einzige Lösung mit POS-Integration für den DACH-Raum und einem integrierten Marktplatz.

---

## 5. Marketing und Vertrieb

### 5.1 Kundengewinnungsstrategie

| Kanal | Methode | Budget |
|---|---|---|
| **Cold Outreach** | Direkte E-Mails/Besuche bei Shisha-Bars | €0 (eigene Arbeit) |
| **SEO** | Blogbeiträge: "Shisha Bar Software", "Kassensystem Shisha Bar" | €0 |
| **Instagram** | @hookahtorus_de, Branchenrelevanter Content | €100/Monat |
| **Partnerschaften** | Tabak-Distributoren als Vertriebskanal | €0 |
| **Mundpropaganda** | Free-Tier als Einstieg, Weiterempfehlung | €0 |
| **Google Ads** | Zielgerichtete Werbung ab Q2 | €200–500/Monat (ab Q2) |

### 5.2 Vertriebsprozess

```
Akquise (Cold Email/Instagram) → Free Account →
Onboarding (3 Min) → Nutzung (2-4 Wochen) →
Pro-Upgrade (€29/Monat) → Marktplatz-Nutzung (Provision)
```

### 5.3 Preismodell

| Tarif | Preis | Zielgruppe |
|---|---|---|
| **Free** | €0/Monat | Einstieg: 20 Produkte, 3 Schüsseln, 30 Tage Historie |
| **Pro** | €29/Monat | POS-Integration, unbegrenzt Inventar, Export, Marktplatz |
| **Enterprise** | €79/Monat | Auto-Nachbestellung, API, Multi-Standort, DATEV-Export |

---

## 6. Finanzplanung

### 6.1 Umsatzplanung (3 Jahre)

#### Jahr 1 (konservativ)

| Quartal | Zahlende Bars | MRR | Quartalsumsatz |
|---|---|---|---|
| Q1 (Mrz–Mai) | 8 | €232 | €696 |
| Q2 (Jun–Aug) | 20 | €580 | €1.740 |
| Q3 (Sep–Nov) | 35 | €1.015 | €3.045 |
| Q4 (Dez–Feb) | 50 | €1.450 | €4.350 |
| **Gesamt Jahr 1** | | | **€9.831** |

*Annahme: Durchschnittlicher Preis €29/Monat, lineares Wachstum*

#### Marktplatz-Provisionen (ab Q3 Jahr 1)

| Quartal | Aktive Bars | Bestellvolumen/Bar/Monat | Provision 10% | Quartalsumsatz |
|---|---|---|---|---|
| Q3 | 10 | €500 | €50 | €1.500 |
| Q4 | 20 | €800 | €80 | €4.800 |
| **Gesamt Jahr 1** | | | | **€6.300** |

#### Jahr 1 Gesamtumsatz: €16.131

#### Jahr 2

| Quelle | Berechnung | Jahresumsatz |
|---|---|---|
| SaaS (150 Bars × €35 avg) | 150 × €35 × 12 | €63.000 |
| Marktplatz (80 Bars × €100/Monat Provision) | 80 × €100 × 12 | €96.000 |
| **Gesamt Jahr 2** | | **€159.000** |

#### Jahr 3

| Quelle | Berechnung | Jahresumsatz |
|---|---|---|
| SaaS (400 Bars × €40 avg) | 400 × €40 × 12 | €192.000 |
| Marktplatz (200 Bars × €150/Monat Provision) | 200 × €150 × 12 | €360.000 |
| **Gesamt Jahr 3** | | **€552.000** |

### 6.2 Kostenplanung

#### Monatliche Fixkosten

| Position | Monat | Jahr |
|---|---|---|
| Infrastruktur (Vercel, Supabase, Domain) | €50 | €600 |
| Google Workspace | €7 | €84 |
| Stripe Gebühren (~2.9%) | variabel | ~€500 (Jahr 1) |
| Marketing (Instagram, Content) | €100 | €1.200 |
| Buchhaltung (Steuerberater) | €100 | €1.200 |
| Telefon/Internet | €50 | €600 |
| **Gesamt Fixkosten** | **€307** | **€3.684** |

#### Einmalige Kosten (Gründung)

| Position | Betrag |
|---|---|
| Gewerbeanmeldung | €60 |
| Domain (.de) | €12 |
| Visitenkarten/Marketingmaterial | €100 |
| **Gesamt einmalig** | **€172** |

### 6.3 Rentabilitätsvorschau

| | Jahr 1 | Jahr 2 | Jahr 3 |
|---|---|---|---|
| **Umsatz** | €16.131 | €159.000 | €552.000 |
| **Kosten** | €4.856 | €12.000 | €24.000 |
| **Gewinn vor Steuern** | €11.275 | €147.000 | €528.000 |
| **Gewinnmarge** | 70% | 92% | 96% |

*SaaS-Geschäftsmodell: Minimale variable Kosten, hohe Skalierbarkeit*

### 6.4 Liquiditätsplanung (Monat 1–12)

| Monat | Einnahmen | Ausgaben | Gründungszuschuss | Saldo | Kumuliert |
|---|---|---|---|---|---|
| 1 | €0 | €479 | ALG-I + €300 | positiv | positiv |
| 2 | €0 | €307 | ALG-I + €300 | positiv | positiv |
| 3 | €58 | €307 | ALG-I + €300 | positiv | positiv |
| 4 | €116 | €307 | ALG-I + €300 | positiv | positiv |
| 5 | €232 | €307 | ALG-I + €300 | positiv | positiv |
| 6 | €348 | €307 | ALG-I + €300 | positiv | positiv |
| 7 | €464 | €307 | €300 | €457 | positiv |
| 8 | €580 | €307 | €300 | €573 | positiv |
| 9 | €725 | €307 | €300 | €718 | positiv |
| 10 | €870 | €307 | €300 | €863 | positiv |
| 11 | €1.015 | €350 | €300 | €965 | positiv |
| 12 | €1.450 | €350 | €300 | €1.400 | positiv |

**Der Gründungszuschuss deckt die Lebenshaltungskosten in Phase 1 vollständig ab. Die Geschäftskosten sind minimal (€307/Monat) und werden ab Monat 5 durch eigene Einnahmen gedeckt.**

---

## 7. Rechtsform und Steuern

**Gründungsphase:** Einzelunternehmen (Kleinunternehmerregelung §19 UStG möglich bei Umsatz < €22.000)
**Ab Jahr 2:** Umwandlung in UG (haftungsbeschränkt) geplant

**Steuerliche Aspekte:**
- Einkommensteuer auf Gewinne
- Gewerbesteuer (Freibetrag €24.500)
- Umsatzsteuer: Kleinunternehmerregelung in Jahr 1, danach reguläre Abführung
- Reverse-Charge für B2B-Kunden im EU-Ausland

---

## 8. Chancen und Risiken

### Chancen

| Chance | Auswirkung |
|---|---|
| Kein Wettbewerb in DE | Schnelle Marktdurchdringung möglich |
| Regulierungsdruck (TSE, KassenSichV) | Bars MÜSSEN Software nutzen → Nachfrage steigt |
| Wachsender Shisha-Markt (CAGR 5%+) | Mehr potenzielle Kunden |
| Marktplatz-Effekt | Jeder neue Bar-Kunde = wiederkehrender Handelsumsatz |
| Skalierbarkeit | Software hat praktisch keine Grenzkosten |

### Risiken und Gegenmaßnahmen

| Risiko | Wahrscheinlichkeit | Gegenmaßnahme |
|---|---|---|
| Langsame Kundenakquise | Mittel | Free-Tier als niedrige Einstiegshürde, persönliche Besuche |
| Regulierung von Shisha-Bars | Gering | Diversifizierung auf andere Märkte (AT, CH, UAE) |
| Technischer Ausfall | Gering | Cloud-Infrastruktur (Vercel/Supabase) mit 99.9% SLA |
| Kopie durch POS-Anbieter | Gering | First-Mover-Vorteil, Nischenmarkt zu klein für große Anbieter |
| Zahlungsausfälle | Gering | Monatliche Vorauszahlung, automatische Abbuchung |

---

## 9. Zukunftsaussichten

**Phase 1 (2026):** Deutschland — 50+ zahlende Bars, Marktplatz-Einführung
**Phase 2 (2027):** DACH-Expansion, 150+ Bars, DATEV-Integration, eigenständiges Kassensystem
**Phase 3 (2028):** Europäische Expansion (NL, FR, UAE), 400+ Bars, €500K+ Jahresumsatz

Das Geschäftsmodell ist hochgradig skalierbar: Die Software ist bereits entwickelt, die Grenzkosten pro neuem Kunden sind nahezu null. Die Kombination aus SaaS-Abonnements und Marktplatz-Provisionen schafft zwei komplementäre Umsatzströme mit hohem Lock-in-Effekt.

---

## 10. Kapital- und Förderbedarf

**Eigenkapital:** Die Plattform ist bereits vollständig entwickelt und live. Kein Kapitalbedarf für Produktentwicklung.

**Gründungszuschuss:** Beantragt zur Deckung der Lebenshaltungskosten während der Aufbauphase (6 Monate ALG-I + €300 Pauschale, danach 9 Monate €300).

**Zusätzlicher Kapitalbedarf:** Keiner. Die monatlichen Betriebskosten (~€307) sind minimal und werden ab Monat 5 durch eigene Einnahmen gedeckt.

---

*Erstellt im Februar 2026 | Hookah Torus | https://hookahtorus.com*
