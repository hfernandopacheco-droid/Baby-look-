import { VaccineItem } from './types';

export const INITIAL_VACCINES: VaccineItem[] = [
  {
    id: 'bcg',
    name: 'BCG (Bacilo de Calmette-Guérin)',
    ageMonth: 0,
    ageLabel: '0 meses (Recién nacido)',
    dose: 'Dosis Única',
    disease: 'Tuberculosis',
    explain: 'Protege contra las formas graves de tuberculosis, especialmente meningitis tuberculosa y diseminada.',
    applied: false
  },
  {
    id: 'hepb1',
    name: 'Hepatitis B (Monovalente pediátrica)',
    ageMonth: 0,
    ageLabel: '0 meses (Primeras 24 horas)',
    dose: '1ra Dosis',
    disease: 'Hepatitis B',
    explain: 'Previene la transmisión perinatal del virus de la hepatitis B y la infección crónica en el lactante.',
    applied: false
  },
  {
    id: 'penta1',
    name: 'Pentavalente Celular / Acelular',
    ageMonth: 2,
    ageLabel: '2 meses',
    dose: '1ra Dosis',
    disease: 'Difteria, Tétanos, Tos ferina, Hib y Hepatitis B',
    explain: 'Combina antígenos esenciales para proteger contra cinco enfermedades pediátricas graves en un solo pinchazo.',
    applied: false
  },
  {
    id: 'polio1',
    name: 'Poliomielitis Inactivada (IPV)',
    ageMonth: 2,
    ageLabel: '2 meses',
    dose: '1ra Dosis',
    disease: 'Poliomielitis',
    explain: 'Vacuna inyectable con virus inactivados que confiere inmunidad sólida contra la parálisis infantil.',
    applied: false
  },
  {
    id: 'rota1',
    name: 'Rotavirus (Oral)',
    ageMonth: 2,
    ageLabel: '2 meses',
    dose: '1ra Dosis',
    disease: 'Gastroenteritis por Rotavirus',
    explain: 'Previene la deshidratación severa y hospitalizaciones provocadas por diarreas agudas en lactantes.',
    applied: false
  },
  {
    id: 'neumo1',
    name: 'Neumococo Conjugada (PCV13)',
    ageMonth: 2,
    ageLabel: '2 meses',
    dose: '1ra Dosis',
    disease: 'Neumonía, Otitis y Meningitis Neumocócica',
    explain: 'Defiende al lactante de la bacteria Streptococcus pneumoniae y sus complicaciones invasivas.',
    applied: false
  },
  {
    id: 'penta2',
    name: 'Pentavalente (Segunda dosis)',
    ageMonth: 4,
    ageLabel: '4 meses',
    dose: '2da Dosis',
    disease: 'Difteria, Tétanos, Tos ferina, Hib y Hep B',
    explain: 'Refuerza los títulos de anticuerpos protectores inducidos en el esquema inicial de dos meses.',
    applied: false
  },
  {
    id: 'polio2',
    name: 'Poliomielitis Inactivada (IPV - 2da)',
    ageMonth: 4,
    ageLabel: '4 meses',
    dose: '2da Dosis',
    disease: 'Poliomielitis',
    explain: 'Consolida la protección neuroinmune contra los tres serotipos del poliovirus.',
    applied: false
  },
  {
    id: 'neumo2',
    name: 'Neumococo Conjugada (PCV13 - 2da)',
    ageMonth: 4,
    ageLabel: '4 meses',
    dose: '2da Dosis',
    disease: 'Neumococo e infecciones invasivas',
    explain: 'Segunda dosis para asegurar anticuerpos duraderos frente a serotipos circulantes.',
    applied: false
  },
  {
    id: 'rota2',
    name: 'Rotavirus (Oral - 2da)',
    ageMonth: 4,
    ageLabel: '4 meses',
    dose: '2da Dosis',
    disease: 'Gastroenteritis por Rotavirus',
    explain: 'Completa o refuerza el esquema contra infecciones entéricas de alto riesgo por rotavirus.',
    applied: false
  },
  {
    id: 'penta3',
    name: 'Pentavalente (Tercera dosis)',
    ageMonth: 6,
    ageLabel: '6 meses',
    dose: '3ra Dosis',
    disease: 'Difteria, Tétanos, Tos ferina, Hib y Hep B',
    explain: 'Cierra el esquema primario del primer semestre con máxima tasa de seroconversión.',
    applied: false
  },
  {
    id: 'polio3',
    name: 'Poliomielitis Inactivada (IPV - 3ra)',
    ageMonth: 6,
    ageLabel: '6 meses',
    dose: '3ra Dosis',
    disease: 'Poliomielitis',
    explain: 'Tercera dosis del esquema básico garantizando protección total frente a brotes.',
    applied: false
  },
  {
    id: 'influ1',
    name: 'Influenza Pediátrica',
    ageMonth: 6,
    ageLabel: '6 meses',
    dose: '1ra Dosis',
    disease: 'Gripe estacional severa',
    explain: 'Protege contra cepas estacionales de influenza y previene complicaciones pulmonares en menores de un año.',
    applied: false
  },
  {
    id: 'srp1',
    name: 'Triple Viral (SRP)',
    ageMonth: 12,
    ageLabel: '12 meses (1 año)',
    dose: '1ra Dosis',
    disease: 'Sarampión, Rubéola y Parotiditis (Paperas)',
    explain: 'Vacuna de virus vivos atenuados fundamental para prevenir complicaciones respiratorias y neurológicas.',
    applied: false
  },
  {
    id: 'varicela',
    name: 'Varicela Zóster',
    ageMonth: 12,
    ageLabel: '12 meses (1 año)',
    dose: '1ra Dosis / Única',
    disease: 'Varicela',
    explain: 'Protege contra la infección por virus varicela-zóster y previene sobreinfecciones bacterianas cutáneas.',
    applied: false
  }
];

export const VACUNAS_DATA = INITIAL_VACCINES;
