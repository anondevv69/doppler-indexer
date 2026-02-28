/**
 * Optional allowlist for "Bankr-only" mode: only index v4pools and cumulatedFees
 * for pools whose base token is in BANKR_BASE_TOKENS (comma-separated addresses).
 * When unset or empty, all pools are indexed (default).
 */

let cachedSet: Set<string> | null = undefined;

function parseAllowlist(): Set<string> | null {
  if (cachedSet !== undefined) return cachedSet;
  const raw = process.env.BANKR_BASE_TOKENS;
  if (!raw || typeof raw !== "string" || raw.trim() === "") {
    cachedSet = null;
    return null;
  }
  const addrs = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length === 42 && s.startsWith("0x"));
  cachedSet = addrs.length > 0 ? new Set(addrs) : null;
  return cachedSet;
}

export function isBankrOnlyEnabled(): boolean {
  return parseAllowlist() !== null;
}

export function isTokenInBankrList(baseToken: string): boolean {
  const set = parseAllowlist();
  if (!set) return true; // no filter = allow all
  return set.has(baseToken.toLowerCase());
}
