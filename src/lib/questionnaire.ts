export type QuestionnaireQuestion = {
  section: string
  sectionLabel: string
  key: string
  label: string
  options: string[]
}

export type QuestionnaireAnswer = {
  choice: string
  zusatz: string
}

export const QUESTIONNAIRE_QUESTIONS: QuestionnaireQuestion[] = [
  {
    section: 'aktuelle_zielgruppe',
    sectionLabel: 'Aktuelle Zielgruppe',
    key: 'altersgruppe',
    label: 'In welcher Altersgruppe ist eure aktuelle Zielgruppe hauptsächlich?',
    options: ['Unter 18', '18–24', '25–34', '35–44', '45–54', '55+', 'Gemischt'],
  },
  {
    section: 'aktuelle_zielgruppe',
    sectionLabel: 'Aktuelle Zielgruppe',
    key: 'geschlecht',
    label: 'Wie ist die Geschlechterverteilung eurer Zielgruppe?',
    options: ['Überwiegend weiblich', 'Überwiegend männlich', 'Ausgeglichen', 'Keine Angabe'],
  },
  {
    section: 'aktuelle_zielgruppe',
    sectionLabel: 'Aktuelle Zielgruppe',
    key: 'region',
    label: 'Wo befindet sich eure Zielgruppe hauptsächlich?',
    options: ['Lokal / regional', 'National (Österreich)', 'DACH-Raum', 'International'],
  },
  {
    section: 'ziele',
    sectionLabel: 'Ziele der Zusammenarbeit',
    key: 'hauptziel',
    label: 'Was ist euer wichtigstes Ziel für die Zusammenarbeit mit AWG?',
    options: ['Mehr Bekanntheit', 'Mehr Anfragen/Leads', 'Mehr Verkäufe', 'Community aufbauen', 'Image verbessern'],
  },
  {
    section: 'ziele',
    sectionLabel: 'Ziele der Zusammenarbeit',
    key: 'tone_of_voice',
    label: 'Wie soll die Marke nach außen wirken?',
    options: ['Seriös / professionell', 'Locker / nahbar', 'Jung / trendig', 'Premium / exklusiv'],
  },
  {
    section: 'wettbewerb',
    sectionLabel: 'Wettbewerb & Positionierung',
    key: 'abgrenzung',
    label: 'Was unterscheidet euch am meisten von der Konkurrenz?',
    options: ['Preis', 'Qualität', 'Service', 'Innovation', 'Regionalität'],
  },
]
