import { LanguageCode, Recipe } from './types';
import { BaseAiRecipe } from './utils';
import { localeEs } from './locales/es';
import { localeEn } from './locales/en';
import { localePt } from './locales/pt';
import { localePl } from './locales/pl';
import { localeRu } from './locales/ru';
import { localeFr } from './locales/fr';
import { localeDe } from './locales/de';
import { localeZh } from './locales/zh';
import { localeAr } from './locales/ar';
import { localeHi } from './locales/hi';

export const RECIPE_AGE_LABELS: Record<LanguageCode, string> = {
  es: localeEs.ageLabel,
  en: localeEn.ageLabel,
  pt: localePt.ageLabel,
  pl: localePl.ageLabel,
  ru: localeRu.ageLabel,
  fr: localeFr.ageLabel,
  de: localeDe.ageLabel,
  zh: localeZh.ageLabel,
  ar: localeAr.ageLabel,
  hi: localeHi.ageLabel
};

export const RECIPE_BLW_CUTS: Record<LanguageCode, { under8: string; under11: string; over11: string }> = {
  es: localeEs.blwCuts,
  en: localeEn.blwCuts,
  pt: localePt.blwCuts,
  pl: localePl.blwCuts,
  ru: localeRu.blwCuts,
  fr: localeFr.blwCuts,
  de: localeDe.blwCuts,
  zh: localeZh.blwCuts,
  ar: localeAr.blwCuts,
  hi: localeHi.blwCuts
};

export const RECIPE_PREP_STEP: Record<LanguageCode, string> = {
  es: localeEs.prepStep,
  en: localeEn.prepStep,
  pt: localePt.prepStep,
  pl: localePl.prepStep,
  ru: localeRu.prepStep,
  fr: localeFr.prepStep,
  de: localeDe.prepStep,
  zh: localeZh.prepStep,
  ar: localeAr.prepStep,
  hi: localeHi.prepStep
};

export const RECIPE_DIFFICULTY: Record<LanguageCode, { easy: string; veryEasy: string }> = {
  es: localeEs.difficulty,
  en: localeEn.difficulty,
  pt: localePt.difficulty,
  pl: localePl.difficulty,
  ru: localeRu.difficulty,
  fr: localeFr.difficulty,
  de: localeDe.difficulty,
  zh: localeZh.difficulty,
  ar: localeAr.difficulty,
  hi: localeHi.difficulty
};

export const RECIPE_VARIANT_LABEL: Record<LanguageCode, string> = {
  es: localeEs.variantLabel,
  en: localeEn.variantLabel,
  pt: localePt.variantLabel,
  pl: localePl.variantLabel,
  ru: localeRu.variantLabel,
  fr: localeFr.variantLabel,
  de: localeDe.variantLabel,
  zh: localeZh.variantLabel,
  ar: localeAr.variantLabel,
  hi: localeHi.variantLabel
};

export function getLocalizedRecipe(base: BaseAiRecipe, lang: LanguageCode): BaseAiRecipe {
  return base;
}

export function getLocalizedCatalogRecipe(recipe: any, lang: LanguageCode) {
  return recipe;
}
