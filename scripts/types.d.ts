export type Mode = "naive" | "principled";
export type LabState = "idle" | "running" | "settled" | "compare" | "error";
export type Zone = "control" | "response" | "internals" | "verdict";
export type Category =
  | "data"
  | "security"
  | "code-design"
  | "api"
  | "performance"
  | "reliability";
export type Difficulty = "foundational" | "intermediate" | "advanced";
export type BlastRadius = "annoying" | "expensive" | "catastrophic";
export type Provenance = "classic" | "field-report" | "derived";
export type StageBg = "deep" | "raised" | "void" | "ledger";

/** One access against store.js — the accounting every Verdict number traces back to (RULE 7a). */
export interface QueryCost {
  readonly table: string;
  readonly op: "select" | "insert" | "update";
  readonly rowsScanned: number;
  readonly rowsReturned: number;
  readonly usedIndex: boolean;
  readonly ms: number;
}

export interface RunResult {
  readonly mode: Mode;
  readonly metrics: Readonly<Record<string, number>>;
  readonly costs: readonly QueryCost[];
  readonly state: LabState;
}

// ---- runtime/rng.js --------------------------------------------------

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(arr: readonly T[]): T;
  jitter(value: number, pct: number): number;
}

// ---- runtime/logger.js ------------------------------------------------

export interface LogEvent {
  readonly type: string;
  readonly payload: unknown;
  readonly at: number;
}

export type LogListener = (payload: unknown) => void;

export interface Logger {
  emit(type: string, payload?: unknown): void;
  on(type: string, fn: LogListener): void;
  off(type: string, fn: LogListener): void;
  history(): readonly LogEvent[];
}

// ---- runtime/clock.js --------------------------------------------------

export interface ClockOptions {
  readonly speed?: number;
  readonly ceilingMs?: number;
  readonly reducedMotion?: boolean;
}

export interface Clock {
  sleep(simMs: number): Promise<void>;
  now(): number;
  skip(): void;
  abort(): void;
  onTick(fn: (simMs: number) => void): () => void;
}

// ---- runtime/store.js --------------------------------------------------

export type Row = Readonly<Record<string, unknown>>;

export interface SelectOptions {
  readonly index?: boolean;
  readonly limit?: number;
}

export interface Store {
  select(table: string, predicate: (row: Row) => boolean, opts?: SelectOptions): readonly Row[];
  insert(table: string, row: Row): void;
  tx<T>(fn: () => T): T;
  costs(): readonly QueryCost[];
  reset(): void;
}

// ---- runtime/server.js --------------------------------------------------

export interface ServerResponse {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: unknown;
  readonly ms: number;
}

export interface ServerInit {
  readonly method?: string;
  readonly body?: unknown;
}

export interface ServerRequest {
  readonly path: string;
  readonly init?: ServerInit;
}

export type RouteHandler = (init: ServerInit, store: Store) => ServerResponse | Promise<ServerResponse>;

export interface Server {
  route(path: string, handler: RouteHandler): void;
  fetch(path: string, init?: ServerInit): Promise<ServerResponse>;
  parallel(reqs: readonly ServerRequest[]): Promise<readonly ServerResponse[]>;
}

// ---- runtime/persist.js --------------------------------------------------

export type PersistScope = "read" | "prefs" | "hub";

export interface Persist {
  get<T>(scope: PersistScope, id?: string): T | null;
  set<T>(scope: PersistScope, id: string | undefined, value: T): void;
  remove(scope: PersistScope, id?: string): void;
  available(): boolean;
}

// ---- runtime/lab.js --------------------------------------------------

export interface ButtonControl {
  readonly type: "button";
  readonly id: string;
  readonly label: string;
}

export interface RangeControl {
  readonly type: "range";
  readonly id: string;
  readonly label: string;
  readonly values: readonly number[];
  readonly default: number;
}

export type Control = ButtonControl | RangeControl;

export interface StageSpec {
  readonly bg: StageBg;
  readonly layout: string;
  readonly zones: Readonly<Record<Zone, string>>;
  readonly hues: readonly string[];
}

export interface ModelSpec {
  readonly note: string;
  readonly seed: number;
}

export interface MetricSpec {
  readonly key: string;
  readonly label: string;
  readonly unit: string;
  readonly fmt?: "duration" | "count" | "bytes" | "money" | "pct";
}

export interface RunContext {
  readonly mode: Mode;
  readonly inputs: Readonly<Record<string, number>>;
  readonly db: Store;
  readonly server: Server;
  readonly log: (type: string, payload?: unknown) => void;
  readonly clock: Clock;
}

export interface LabRunOutcome {
  readonly metrics: Readonly<Record<string, number>>;
}

export interface LabSpec {
  readonly id: string;
  readonly stage: StageSpec;
  readonly modes?: Readonly<Record<Mode, string>>;
  readonly controls: readonly Control[];
  readonly model: ModelSpec;
  readonly metrics: readonly MetricSpec[];
  /** SafetyLine text ("Runs entirely in your browser..."). Required on every security lab. */
  readonly safety?: string;
  readonly run: (ctx: RunContext) => Promise<LabRunOutcome>;
}

// ---- data/seed.js --------------------------------------------------

export interface Company {
  readonly id: number;
  readonly name: string;
}

export interface Candidate {
  readonly id: number;
  readonly companyId: number;
  readonly name: string;
  readonly email: string;
}

export interface User {
  readonly id: number;
  readonly email: string;
  readonly passwordHash: string;
}

export interface Transaction {
  readonly id: number;
  readonly userId: number;
  readonly amount: number;
  readonly createdAt: number;
}

export interface Dataset {
  readonly candidates: readonly Candidate[];
  readonly companies: readonly Company[];
  readonly users: readonly User[];
  readonly transactions: readonly Transaction[];
}

// ---- data/catalog.js --------------------------------------------------

export interface CatalogEntry {
  readonly slug: string;
  readonly title: string;
  readonly category: Category;
  readonly difficulty: Difficulty;
  readonly blastRadius: BlastRadius;
  readonly provenance: Provenance;
  readonly related: readonly string[];
  readonly runnable: boolean;
}

export interface CatalogStats {
  readonly problems: number;
  readonly categoriesUsed: number;
  readonly categoriesTotal: number;
}
