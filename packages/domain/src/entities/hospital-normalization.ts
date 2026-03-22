function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function buildCompactKey(text: string) {
  return normalizeWhitespace(text).toLowerCase().replace(/[\s().,-]/g, "");
}

const DEPARTMENT_ONLY_PATTERNS = [
  /\uC554\uC13C\uD130/u,
  /\uC13C\uD130$/u,
  /\uC9C4\uB8CC\uACFC/u,
  /\uC758\uD559\uACFC/u
];
const HOSPITAL_SUFFIX_PATTERN = /(\uBCD1\uC6D0|\uC758\uC6D0|clinic|hospital)$/iu;
const ADDRESS_TOKEN_PATTERN =
  /(^\d+$|\uBC88\uC9C0$|\uB85C$|\uAE38$|\uB3D9$|\uAD6C$|\uC2DC$|\uAD70$|\uC74D$|\uBA74$|\uD2B9\uBCC4\uC2DC$|\uAD11\uC5ED\uC2DC$|\uD2B9\uBCC4\uC790\uCE58\uC2DC$|\uD2B9\uBCC4\uC790\uCE58\uB3C4$|\uB3C4$)/u;
const GENERIC_PREFIX_PATTERN =
  /^(\uC758\uB8CC\uBC95\uC778|\uC7AC\uB2E8\uBC95\uC778|\uD559\uAD50\uBC95\uC778)/u;

const HOSPITAL_ALIAS_RULES: Array<{ match: (compactKey: string) => boolean; canonicalName: string }> = [
  {
    match: (compactKey) =>
      compactKey.includes("sm\uc601\uc0c1\uc758\ud559\uacfc\uc758\uc6d0") ||
      compactKey.includes("\uc5d0\uc2a4\uc5e0\uc601\uc0c1\uc758\ud559\uacfc\uc758\uc6d0"),
    canonicalName: "\uC5D0\uC2A4\uC5E0\uC601\uC0C1\uC758\uD559\uACFC\uC758\uC6D0"
  },
  {
    match: (compactKey) => compactKey.includes("\uC0BC\uC131\uC11C\uC6B8\uBCD1\uC6D0"),
    canonicalName: "\uC0BC\uC131\uC11C\uC6B8\uBCD1\uC6D0"
  },
  {
    match: (compactKey) =>
      compactKey.includes("\uC774\uB300\uBAA9\uB3D9\uBCD1\uC6D0") ||
      compactKey.includes("\uC774\uD654\uC5EC\uC790\uB300\uD559\uAD50\uBAA9\uB3D9\uBCD1\uC6D0") ||
      compactKey.includes("eumc\uC774\uB300\uBAA9\uB3D9\uBCD1\uC6D0"),
    canonicalName: "\uC774\uB300\uBAA9\uB3D9\uBCD1\uC6D0"
  },
  {
    match: (compactKey) =>
      compactKey.includes("\uAD6D\uBBFC\uAC74\uAC15\uBCF4\uD5D8\uC77C\uC0B0\uBCD1\uC6D0") ||
      compactKey.includes("\uAD6D\uBBFC\uAC74\uAC15\uBCF4\uD5D8\uACF5\uB2E8\uC77C\uC0B0\uBCD1\uC6D0"),
    canonicalName: "\uAD6D\uBBFC\uAC74\uAC15\uBCF4\uD5D8 \uC77C\uC0B0\uBCD1\uC6D0"
  },
  {
    match: (compactKey) => compactKey.includes("\uC77C\uC0B0\uBC31\uBCD1\uC6D0"),
    canonicalName: "\uC77C\uC0B0\uBC31\uBCD1\uC6D0"
  },
  {
    match: (compactKey) => compactKey.includes("\uC77C\uC0B0\uCC28\uBCD1\uC6D0"),
    canonicalName: "\uC77C\uC0B0\uCC28\uBCD1\uC6D0"
  }
];

function stripBracketedSegments(text: string) {
  return text.replace(/\([^)]*\)/g, " ").replace(/\[[^\]]*\]/g, " ");
}

function extractCompactHospitalTail(text: string) {
  const compact = normalizeWhitespace(text).replace(/\s+/g, "");
  const matches = [...compact.matchAll(/([A-Za-z\uAC00-\uD7A3]{2,24}(?:\uBCD1\uC6D0|\uC758\uC6D0|clinic|hospital))/giu)];
  return matches.at(-1)?.[1] ?? null;
}

function stripAddressLikePrefix(text: string) {
  const tokens = normalizeWhitespace(text).split(" ").filter(Boolean);
  let suffixIndex = -1;
  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    const token = tokens[index];
    if (token && HOSPITAL_SUFFIX_PATTERN.test(token)) {
      suffixIndex = index;
      break;
    }
  }
  if (suffixIndex === -1) {
    return normalizeWhitespace(text);
  }

  const focusedTokens = tokens
    .slice(Math.max(0, suffixIndex - 3), suffixIndex + 1)
    .filter((token) => !ADDRESS_TOKEN_PATTERN.test(token))
    .filter((token) => !/^\d[\d-]*$/.test(token));

  return normalizeWhitespace(focusedTokens.join(" "));
}

export function canonicalizeHospitalName(rawText: string) {
  const normalized = normalizeWhitespace(stripBracketedSegments(rawText));
  const compactKey = buildCompactKey(normalized);

  const aliasRule = HOSPITAL_ALIAS_RULES.find((rule) => rule.match(compactKey));
  if (aliasRule) {
    return aliasRule.canonicalName;
  }

  const hasHospitalToken = /(\uBCD1\uC6D0|\uC758\uC6D0|clinic|hospital)$/iu.test(normalized);
  if (!hasHospitalToken && DEPARTMENT_ONLY_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return null;
  }

  const stripped = stripAddressLikePrefix(normalized)
    .replace(/\s+(\uBCD1\uC6D0|\uC758\uC6D0)$/u, "$1")
    .replace(/\s+(\uBCF8\uC6D0|\uBD84\uC6D0)$/u, " $1")
    .replace(GENERIC_PREFIX_PATTERN, "")
    .trim();

  const compactTail = extractCompactHospitalTail(stripped);
  if (compactTail) {
    const tailAliasRule = HOSPITAL_ALIAS_RULES.find((rule) => rule.match(buildCompactKey(compactTail)));
    if (tailAliasRule) {
      return tailAliasRule.canonicalName;
    }

    return compactTail;
  }

  return stripped || normalized;
}

export function buildHospitalAliasKey(rawText: string) {
  const canonical = canonicalizeHospitalName(rawText);
  if (!canonical) {
    return null;
  }

  return buildCompactKey(canonical);
}
