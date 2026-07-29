# AltPilot Paper Strategy Proposal — Frontier v5 "Breadth-Gated Trend Rider"

Status: **Proposal — paper-only candidate.** Not a promotion request. The real-order
path remains halted; nothing here changes that.

Honesty note: no strategy can be *guaranteed* to win. This spec is designed so that
(a) each claimed edge is separately testable, (b) parameters are fixed a priori so the
forward paper run is an honest out-of-sample test, and (c) failure is detected cheaply
and quickly.

---

## 1. Why another strategy, and why this one

The six running portfolios (Frontier v4.2, Frontier v3, Opportunity Capture,
Focused v3, Sandbox v2, Ultra-Aggressive v1) are all variants of the same trade:
long-only, short-horizon momentum entries on individual alts, with fixed
reward-to-risk targets and short time stops. They differ mainly in filter tightness
and sizing. That means:

- They are highly correlated with each other and with the BTC regime. Six correlated
  portfolios give you six lottery tickets on the same draw, not six experiments.
- Comparing them mostly measures which parameter set got lucky in this particular
  market window (a multiple-comparisons trap).

Frontier v5 changes three structural things rather than the filter dials:

1. **When to trade at all** — a market-breadth gate (portfolio-level signal, not
   per-coin).
2. **How winners are exited** — trailing exits with no profit cap, instead of a
   fixed ~2.2R target plus a 4-hour clock.
3. **How positions are sized** — fixed fractional *risk* per trade (volatility-
   targeted), instead of fixed 8% *notional*.

Everything else deliberately reuses the shared v4.2 infrastructure so the comparison
isolates these three changes.

## 2. Edge hypotheses (each one falsifiable)

- **H1 — Breadth gating.** Short-horizon alt momentum earns its money in broad
  risk-on windows and bleeds in chop. Gating entries on market breadth (share of the
  scanned universe above its own 21-period MA, and that share rising) should cut the
  bleed more than it cuts the gains. Breadth is computable from data AltPilot
  already produces per coin — it is an aggregation, not a new feed.
- **H2 — Let winners run.** Momentum P&L is right-skewed: most of the profit comes
  from a minority of outsized winners. v4.2's ~2.2R cap and 4-hour hard limit
  amputate exactly that tail. A trailing stop with no profit target should raise
  expectancy even if it lowers win rate.
- **H3 — Risk-based sizing.** Fixed 8% notional means portfolio risk swells when
  volatility swells. Sizing each position so it risks a fixed fraction of paper
  equity at its stop stabilizes drawdowns and improves risk-adjusted return.
- **H4 — Ranked selection.** When several candidates pass the gates in one cycle,
  picking the one with the most *persistent* relative strength vs BTC beats picking
  the first one scanned. (Note: the rejected cross-sectional rotation strategy was a
  standalone rotation system; here relative strength is only a tie-breaker inside a
  gated momentum framework. Different claim, tested separately via H4 ablation.)
- **H5 — Staggered entry.** Entering 60% at signal and adding the remaining 40% only
  after the trade is +1×ATR with the signal still valid cuts losses on immediate
  failures at a modest cost to winners.

If a hypothesis fails its ablation (Section 6), drop that component, keep the rest.

## 3. Entry rules

Reused unchanged from the shared v4.2 stack:

- Positive multi-factor composite score; signal persistent across two completed candles.
- 24h gain between 1% and 7%; RSI(14) between 50 and 73; positive short-term momentum.
- Volume ≥ 95% of recent baseline; spread ≤ 10 bps.
- All hard blocks (spread > 25 bps, volume < $5M, volatility policy).
- Tokenomist unlock filter; FRED macro adjustment when verified.
- At most one new position per cycle; 8-hour cooldown after a loss in the same coin.

New, on top of the above:

- **Breadth gate (H1):** breadth = share of scanned universe trading above its own
  21-period MA. Enter only if breadth ≥ 55% **and** breadth is higher than 6 candles
  ago. If breadth < 45%, also pause adds to existing positions.
- **Selection rank (H4):** among candidates passing all gates in a cycle, rank by
  relative-strength persistence vs BTC (count of the last 12 candles where the coin
  outperformed BTC); take the top-ranked only.
- **BTC regime:** weak regime → half risk (same convention as v4.2); hostile regime
  (regime score below policy floor) → no new entries.

## 4. Position management

- **Max positions:** 4.
- **Sizing (H3):** each position risks **0.6% of paper equity** at its stop.
  Notional per position capped at 10% of equity regardless of the risk math.
  Stop distance = 2.2 × ATR(14), capped at 4%.
- **Entry staging (H5):** 60% of the computed size at signal; add the remaining 40%
  only if price reaches +1×ATR and the composite signal is still valid.
- **Exits (H2):**
  - Initial stop as above.
  - Move stop to break-even at +1R.
  - From +1R onward, trail a chandelier stop at 2.75 × ATR(14) below the highest
    high since entry. **No profit target** — the trail is the only upside exit.
  - Momentum-failure exit (same as v4.2): close early if a losing trade keeps
    weakening.
  - Time stop only for non-performers: at 48 hours, close the position if it is
    below +0.5R; positions above +0.5R keep running on the trail. (This replaces
    v4.2's flat 4-hour limit — the clock should cull dead trades, not winners.)

## 5. Cost realism

Model per round trip, applied to paper fills: taker fees both sides plus half-spread
slippage each side, and an adverse-selection penalty of 5 bps on entries taken within
one candle of the signal. If the strategy is only profitable before these costs, it
is not profitable.

## 6. Validation and promotion gates

Run as a seventh paper portfolio with the same capital base as the others.

- **Parameters are frozen as written here.** Any tweak restarts the forward clock —
  same convention as Leader Consensus.
- **Minimum sample:** ≥ 100 closed trades forward (matching the Leader Consensus
  observation threshold) before any comparison is treated as meaningful.
- **Promotion-to-primary-candidate gates (all required):**
  - Positive expectancy net of Section 5 costs.
  - Profit factor ≥ 1.3; max drawdown ≤ 15% of paper equity.
  - Risk-adjusted return (Sharpe on daily P&L) ≥ Frontier v4.2 over the identical
    window.
- **Ablation logging:** every skipped entry records *which* gate blocked it, and
  every exit records *which* rule fired, so H1–H5 can each be evaluated
  independently instead of judging the strategy as a monolith.
- Real-money promotion is out of scope for this document entirely.

## 7. Cheap A/B worth running on the existing lineup

Independent of v5: clone Frontier v4.2 with only two changes — remove the 2.2R
profit cap in favor of the Section 4 trailing exit, and extend the 4-hour limit to
the 48-hour non-performer rule. If H2 is right, this single change is the highest
expected-value modification available to the current primary strategy, and the A/B
attributes it cleanly.

## 8. What this proposal deliberately avoids

- No new external data dependencies (news, on-chain, whale flows remain unavailable;
  breadth and RS-persistence derive from data already computed per coin).
- No ML component — Focused v3 already encodes "wait for a validated challenger,"
  and no challenger has passed.
- No re-tuning of the six live portfolios' parameters; that path is how the
  multiple-comparisons trap deepens.
