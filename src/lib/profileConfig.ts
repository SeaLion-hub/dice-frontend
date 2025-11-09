// Shared profile configuration: options, keywords, and helpers

export const GENDER_OPTIONS = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
  { value: "prefer_not_to_say", label: "응답하지 않음" },
] as const;

export const ALLOWED_GRADES = ["1", "2", "3", "4", "5", "6"] as const;

export const MILITARY_OPTIONS = [
  { value: "", label: "선택 안 함" },
  { value: "completed", label: "이행(전역)" },
  { value: "pending", label: "이행 예정" },
  { value: "exempt", label: "면제" },
  { value: "n/a", label: "해당 없음" },
] as const;

export const INCOME_OPTIONS = Array.from({ length: 11 }).map((_, i) => ({
  value: String(i),
  label: `${i}분위`,
}));

export const KEYWORDS_TREE: Record<string, string[]> = {
  "#학사": [
    "#소속변경",
    "#ABEEK",
    "#신입생",
    "#S/U",
    "#교직과정",
    "#휴학",
    "#복학",
    "#수강신청",
    "#졸업",
    "#등록금",
    "#교과목",
    "#전공과목",
    "#다전공",
    "#기타",
  ],
  "#장학": ["#가계곤란", "#국가장학", "#근로장학", "#성적우수", "#생활비", "#기타"],
  "#취업": [
    "#채용",
    "#인턴십",
    "#현장실습",
    "#강사",
    "#조교",
    "#채용설명회",
    "#취업특강",
    "#창업",
    "#기타",
  ],
  "#행사": [
    "#특강",
    "#워크숍",
    "#세미나",
    "#설명회",
    "#포럼",
    "#지원",
    "#교육",
    "#프로그램",
    "#기타",
  ],
  "#공모전/대회": [
    "#공모전",
    "#경진대회",
    "#디자인",
    "#숏폼",
    "#영상",
    "#아이디어",
    "#논문",
    "#학생설계전공",
    "#마이크로전공",
    "#기타",
  ],
  "#국제교류": [
    "#교환학생",
    "#파견",
    "#campusasia",
    "#글로벌",
    "#단기",
    "#하계",
    "#동계",
    "#어학연수",
    "#해외봉사",
    "#일본",
    "#미국",
    "#기타",
  ],
  "#일반": [],
};

export const PARENTS_WITHOUT_DETAIL = ["#일반"];

export const TOP_LEVEL_KEYWORDS = Object.keys(KEYWORDS_TREE);

export const ALL_ALLOWED_KEYWORDS = TOP_LEVEL_KEYWORDS.reduce<string[]>(
  (acc, parent) => acc.concat(parent, KEYWORDS_TREE[parent]),
  [],
);

export const TESTS = [
  { key: "toeic", label: "영어 · TOEIC" },
  { key: "toefl", label: "영어 · TOEFL" },
  { key: "ielts", label: "영어 · IELTS" },
  { key: "jlpt", label: "일본어 · JLPT" },
  { key: "hsk", label: "중국어 · HSK" },
] as const;

export type TestKey = (typeof TESTS)[number]["key"];

export type LanguageScores = Record<TestKey, { enabled: boolean; score: string }>;

export function createEmptyLanguageScores(): LanguageScores {
  return TESTS.reduce<LanguageScores>((acc, test) => {
    acc[test.key] = { enabled: false, score: "" };
    return acc;
  }, {} as LanguageScores);
}
