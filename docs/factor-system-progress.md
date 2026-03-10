# Factor System - Development Progress

> Track file for factor system development.
> Read `docs/factor-system-spec.md` for full design specification.

## Current Phase: Phase 2 IN PROGRESS — Custom Factor Engine + AI Mining

## Development Rules

- Factor system is an independent module — do NOT modify existing signal
  detection, attribution analysis, or any core trading logic (Phase 1-2)
- Each Phase must be confirmed with user before moving to next Phase
- New background services must have an on/off switch via env variable
  (`FACTOR_ENGINE_ENABLED=true/false`)
- Database changes follow existing ORM + migration conventions
  (models.py first, migration script if needed, register in migration_manager)
- All code and comments in English, UI text uses i18n (en.json + zh.json)
- No temporary test scripts committed to git
- Frontend Loading animation must use PacmanLoader (`@/components/ui/pacman-loader.tsx`)

## Completed

### Phase 1: Factor Computation Engine + Effectiveness Dashboard ✅

**Database (models.py)**
- [x] `FactorValue` table — symbol/period/factor_name/value/timestamp, unique constraint on (exchange, symbol, period, factor_name, timestamp)
- [x] `FactorEffectiveness` table — IC/ICIR/win_rate/decay per factor×symbol×period×forward_period×calc_date
- [x] Migration: `create_factor_system_tables.py`, `add_exchange_to_factor_effectiveness.py`

**Backend Services**
- [x] `factor_registry.py` — 22 factors across 5 categories (Momentum, Trend, Volatility, Volume, Microstructure)
- [x] `factor_computation_service.py` — scheduled every 1h, computes all registered factors from K-line data, supports technical/microstructure/derived types, progress tracking
- [x] `factor_effectiveness_service.py` — daily batch at UTC 01:00, 500-bar lookback, IC/ICIR/win_rate across 4 forward windows (1h/4h/12h/24h), progress tracking
- [x] Env switch: `FACTOR_ENGINE_ENABLED=true` in docker-compose.yml, startup.py conditional start

**Backend API (factor_routes.py)**
- [x] `GET /api/factors/library` — full factor registry
- [x] `GET /api/factors/values` — latest factor values per symbol/period/exchange
- [x] `GET /api/factors/effectiveness` — effectiveness ranking with sort_by support
- [x] `GET /api/factors/effectiveness/{name}/history` — IC trend over time
- [x] `GET /api/factors/status` — engine status, last compute time from DB
- [x] `POST /api/factors/compute` — async background thread, non-blocking
- [x] `GET /api/factors/compute/estimate` — pre-compute symbol list + time estimate
- [x] `GET /api/factors/compute/progress` — real-time progress (phase/symbol/completed/total)

**Frontend (FactorLibrary.tsx)**
- [x] Factor Library page with sidebar navigation (Flask icon)
- [x] Exchange selector (Hyperliquid/Binance) + Symbol selector from watchlist
- [x] Prediction Window selector (1h/4h/12h/24h) with tooltip explaining it's not K-line period
- [x] Category filter badges (All/Momentum/Trend/Volatility/Volume/Microstructure)
- [x] Data table: Factor Name (with description tooltip), Category, Value (1h K-line), IC, ICIR, Win Rate, Samples
- [x] IC/ICIR/Win Rate sortable columns (click to sort by |value|) with tooltip explanations
- [x] IC color coding: green (|IC|≥0.05), yellow (|IC|≥0.02), grey (weak)
- [x] Manual Compute: confirm dialog with symbol badges + estimate → PacmanLoader progress bar → result summary
- [x] Last Update from DB (persists across restarts), Next Compute countdown
- [x] Full i18n (en.json + zh.json)

**Known Issues / Tech Debt**
- Factor computation uses `calculate_indicators()` from technical_indicators.py — not pandas-ta directly as spec planned. Works fine, but if we need 130+ indicators later, may need pandas-ta integration.
- Effectiveness `_compute_symbol` iterates all 500 bars × 22 factors with sub-slicing — O(n²) for indicators. Acceptable for current scale (~2 symbols), may need optimization if watchlist grows large.
- `decay_half_life` field always NULL — decay curve calculation not yet implemented.

## In Progress

### Phase 2: Custom Factor Engine + AI Factor Mining + Web Search

#### 2A: Custom Factor Expression Engine (CORE)

**Design Decisions**
- Expression syntax: function-style with TA naming (`EMA(close, 20)`, `RSI(close, 14)`)
- Expression ≠ name: expression is the formula, name is a display label (can be any language)
- Custom factors are global (not per-user), stored in DB, reusable by AI and manual compute
- Security: Python `ast` module validates expressions before execution (whitelist safe operations)

**Expression Engine (`factor_expression_engine.py`)**
- [ ] Uses `asteval` (open-source safe expression evaluator) — no custom ast parsing needed
- [ ] Uses `pandas-ta` (open-source, 130+ TA indicators) — no custom TA implementations needed
- [ ] Register pandas-ta functions into asteval execution context, organized by category:
  - Moving Average: `SMA(series, period)`, `EMA(series, period)`, `WMA(series, period)`
  - Momentum: `RSI(series, period)`, `ROC(series, period)`, `MACD(series, fast, slow, signal)`
  - Volatility: `ATR(high, low, close, period)`, `STDDEV(series, period)`, `BBANDS(series, period)`
  - Volume: `VWAP(high, low, close, volume)`, `OBV(close, volume)`
  - Time Series: `DELAY(series, period)`, `DELTA(series, period)`, `TS_MAX(series, period)`, `TS_MIN(series, period)`, `TS_RANK(series, period)`
  - Cross-section: `RANK(series)`, `ZSCORE(series)`
  - Math: `ABS(x)`, `LOG(x)`, `MAX(a, b)`, `MIN(a, b)`, `SIGN(x)`
- [ ] Execution context: K-line DataFrame columns as variables (`open`, `high`, `low`, `close`, `volume`)
- [ ] Expression execution returns a pandas Series (one value per bar)
- [ ] Expression validation endpoint: parse + dry-run on small sample → confirm it computes without error
- [ ] New dependencies: `asteval`, `pandas-ta` (add to requirements/pyproject)

**Database: `CustomFactor` table**
- [ ] Fields: id, name, expression, description, category, source (manual/ai), is_active, created_at
- [ ] Migration script, register in migration_manager
- [ ] ORM model in models.py

**Backend API**
- [ ] `POST /api/factors/custom` — save a custom factor (name, expression, description, category)
- [ ] `GET /api/factors/custom` — list all custom factors
- [ ] `DELETE /api/factors/custom/{id}` — remove a custom factor
- [ ] `POST /api/factors/evaluate` — evaluate an expression on-demand (no save required)
  - Input: expression, symbol, exchange, period, forward_periods
  - Output: factor values sample, IC/ICIR/win_rate per forward period, sample_count
  - Uses expression engine + existing effectiveness math from factor_effectiveness_service

**Integration with Existing System**
- [ ] Custom factors appear in Factor Library alongside built-in 22 factors
- [ ] Custom factors included in scheduled computation (if is_active=true)
- [ ] Factor computation service extended to handle custom factor expressions
- [ ] Expanding built-in factor library (130+) = just insert pre-defined expressions with source="builtin"
  - Phase 1's 22 factors stay on `calculate_indicators()` path (stable, no change)
  - New built-in factors added as CustomFactor records, computed via expression engine
  - No dedicated phase needed for "expand factor library" — it's a config task after 2A is done

#### 2B: Hyper AI Tools

- [ ] `evaluate_factor` tool — accepts expression string, calls `/api/factors/evaluate` internally
- [ ] `recommend_factors` tool — top-N effective factors for given symbol + trading style
- [ ] `web_search` tool — Tavily API integration for quant research
- [ ] Tavily API key config in Hyper AI sidebar Tools panel
- [ ] Factor mining memory per conversation (explored hypotheses + results)
- [ ] AI prompt engineering: teach AI factor hypothesis formulation + IC interpretation + expression syntax

### Phase 3: Signal Pool Integration
- [ ] `factor` metric type in signal_detection_service.py
- [ ] Signal creation UI: factor selection from library
- [ ] Threshold suggestion based on factor distribution

### Phase 4: AI Trader & Program Trader Integration
- [ ] AI Trader: factor context injection into prompts
- [ ] Program Trader: data_provider factor API
- [ ] Theory vs Reality dashboard (factor IC vs actual signal win rate)

## Decisions Log

- 2026-03-07: Factor values update follows K-line period, not fixed interval
- 2026-03-07: Factor effectiveness computed once per day (batch)
- 2026-03-07: Hyper AI on-demand validation is separate from scheduled tasks
- 2026-03-07: Web search uses Tavily, user-provided key, config in AI panel
- 2026-03-07: Factor effectiveness and signal threshold are decoupled concepts
- 2026-03-09: Manual compute runs in background thread to avoid blocking uvicorn event loop
- 2026-03-09: Symbol service imports fixed (module-level functions, not class instances)
- 2026-03-09: Last compute time persisted via DB MAX(created_at), not just in-memory
- 2026-03-09: IC/ICIR sort by absolute value (both positive and negative IC are useful)
- 2026-03-09: Phase 2 core = custom factor expression engine (user/AI submit arbitrary formulas for evaluation)
- 2026-03-09: Expression syntax uses TA-style naming (EMA/RSI/MACD), not WorldQuant-style (ts_mean/cs_rank)
- 2026-03-09: Factor name is just a display label (any language OK), expression is the computation formula
- 2026-03-09: Custom factors are global (not per-user), AI and manual share same infrastructure
- 2026-03-09: Expression safety via Python ast module (whitelist safe nodes, reject imports/exec/file ops)
- 2026-03-10: Use open-source libs instead of reinventing: asteval (safe eval) + pandas-ta (130+ TA indicators)
- 2026-03-10: Phase 1's 22 factors keep calculate_indicators() path; pandas-ta only for custom expression engine
- 2026-03-10: Expanding built-in library (130+) is a config task after expression engine is done (insert pre-defined expressions)
