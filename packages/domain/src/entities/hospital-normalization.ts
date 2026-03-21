function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function buildCompactKey(text: string) {
  return normalizeWhitespace(text).toLowerCase().replace(/[\s().,-]/g, "");
}

const DEPARTMENT_ONLY_PATTERNS = [/암센터$/, /센터$/, /진료과$/, /의학과$/];

const HOSPITAL_ALIAS_RULES: Array<{ match: (compactKey: string) => boolean; canonicalName: string }> = [
  {
    match: (compactKey) => compactKey.includes("sm") && compactKey.includes("영상의학과") && compactKey.includes("의원"),
    canonicalName: "에스엠영상의학과의원"
  },
  {
    match: (compactKey) => compactKey.includes("삼성서울병원"),
    canonicalName: "삼성서울병원"
  },
  {
    match: (compactKey) => compactKey.includes("이대목동병원") || compactKey.includes("이화여자대학교목동병원"),
    canonicalName: "이대목동병원"
  },
  {
    match: (compactKey) => compactKey.includes("국민건강보험일산병원"),
    canonicalName: "국민건강보험 일산병원"
  },
  {
    match: (compactKey) => compactKey.includes("일산백병원"),
    canonicalName: "일산백병원"
  },
  {
    match: (compactKey) => compactKey.includes("해븐리병원"),
    canonicalName: "해븐리병원"
  }
];

export function canonicalizeHospitalName(rawText: string) {
  const normalized = normalizeWhitespace(rawText);
  const compactKey = buildCompactKey(normalized);

  const aliasRule = HOSPITAL_ALIAS_RULES.find((rule) => rule.match(compactKey));
  if (aliasRule) {
    return aliasRule.canonicalName;
  }

  const hasHospitalToken = /(병원|의원|clinic|hospital)$/i.test(normalized);
  if (!hasHospitalToken && DEPARTMENT_ONLY_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return null;
  }

  return normalized
    .replace(/\s+(병원|의원)$/u, "$1")
    .replace(/\s+(본원|분원)$/u, " $1")
    .trim();
}

export function buildHospitalAliasKey(rawText: string) {
  const canonical = canonicalizeHospitalName(rawText);
  if (!canonical) {
    return null;
  }

  return buildCompactKey(canonical);
}
