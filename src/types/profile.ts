import type {
  LanguageScores,
} from "@/lib/profileConfig";

import type {
  GENDER_OPTIONS,
  ALLOWED_GRADES,
  MILITARY_OPTIONS,
} from "@/lib/profileConfig";

export type GenderValue = (typeof GENDER_OPTIONS)[number]["value"];
export type GradeValue = (typeof ALLOWED_GRADES)[number];
export type MilitaryValue = (typeof MILITARY_OPTIONS)[number]["value"];

export type ProfileFormValues = {
  gender: GenderValue;
  age: string;
  grade: GradeValue;
  college: string;
  major: string;
  military_service: MilitaryValue;
  income_bracket: string;
  gpa: string;
  keywords: string[];
  languageScores: LanguageScores;
};
