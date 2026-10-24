import { createRng } from "../runtime/rng.js";

/**
 * @param {number} id
 * @param {number} [width]
 * @returns {string}
 */
function pad(id, width = 4) {
  return String(id).padStart(width, "0");
}

/**
 * Builds a reproducible fake dataset from a seed — generated, never
 * downloaded (RULE 7c). 50k rows this way costs ~0 bytes and ~15ms, and the
 * same seed always produces the same rows, on every machine. Every row is
 * obviously fake: `.invalid` emails (RFC 2606) and placeholder names, since
 * some labs intentionally leak this table onto the screen.
 * @param {number} [seed]
 * @param {{ candidates?: number, companies?: number, users?: number, transactions?: number }} [sizes]
 * @returns {import("../types.d.ts").Dataset}
 */
export function buildDataset(seed = 20261024, sizes = {}) {
  const {
    candidates: candidateCount = 200,
    companies: companyCount = 20,
    users: userCount = 50,
    transactions: transactionCount = 100
  } = sizes;
  const rng = createRng(seed);

  /** @type {import("../types.d.ts").Company[]} */
  const companies = [];
  for (let id = 1; id <= companyCount; id += 1) {
    companies.push({ id, name: `Company ${pad(id, 2)}` });
  }

  /** @type {import("../types.d.ts").Candidate[]} */
  const candidates = [];
  for (let id = 1; id <= candidateCount; id += 1) {
    const companyId = 1 + Math.floor(rng.next() * companyCount);
    candidates.push({
      id,
      companyId,
      name: `Candidate ${pad(id)}`,
      email: `fake.candidate+${pad(id)}@example.invalid`
    });
  }

  /** @type {import("../types.d.ts").User[]} */
  const users = [];
  for (let id = 1; id <= userCount; id += 1) {
    users.push({
      id,
      email: `fake.user+${pad(id)}@example.invalid`,
      passwordHash: `$2b$fake$${Math.floor(rng.next() * 1e9).toString(16)}`
    });
  }

  /** @type {import("../types.d.ts").Transaction[]} */
  const transactions = [];
  for (let id = 1; id <= transactionCount; id += 1) {
    const userId = 1 + Math.floor(rng.next() * userCount);
    transactions.push({
      id,
      userId,
      amount: Math.round(rng.next() * 500000),
      createdAt: 1700000000000 + Math.floor(rng.next() * 1e10)
    });
  }

  return { candidates, companies, users, transactions };
}
