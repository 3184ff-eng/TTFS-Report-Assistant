# AltPilot Research Operating Rules

Adopted 27 August 2026. These rules govern all AltPilot strategy research.
They were derived from forward evidence: the legacy strategy blend lost
$574.52 across 2,071 paper trades (definition reconciliation pending), and
every rule below is a direct response to a measured failure mode.

## Registration and evidence

1. **Pre-registration is mandatory.** A strategy's parameters are written,
   timestamped, and hashed before its governed forward sample begins. Trades
   closed before registration are retained as exploratory history and
   excluded from the forward clock. Registrations are never backdated, even
   when parameters are believed unchanged — unverifiable claims don't count.
2. **Frozen means frozen.** Any parameter change invalidates the forward
   sample and restarts the clock. Input-measurement corrections (bug fixes in
   what an indicator measures) are permitted but must be versioned,
   timestamped in the audit record, and must reset any derived buffers so
   pre-fix and post-fix observations cannot be silently combined.
3. **Promotion gate:** at least 100 eligible forward trades, six weeks
   elapsed, multiple volatility regimes, positive net expectancy after
   modeled costs — with margin, not merely crossing zero, because parallel
   experiments inflate the best-looking result by selection.
4. **One new registration at a time.** Existing frozen experiments continue
   in parallel; the rule constrains additions.
5. **Dead strategies stay dead.** Retired configurations are permanently
   quarantined (thaw guard enforced); their ledgers are preserved as
   rejection evidence.

## Backtesting

6. **Backtests are screening filters only.** Parameters are hashed before
   the backtest and evaluated walk-forward. A pass earns a forward slot and
   nothing more; a failure is final for that parameter set. Backtests are
   never cited as evidence of edge.
7. **Maker-fill and queue-position claims require forward evidence.**
   Bar-based backtests cannot simulate fills honestly; execution-cost
   experiments are judged only on forward samples with pessimistic fill
   models and missed-fill outcome tracking, compared at the portfolio level
   against a taker control over the same window.

## Costs and eligibility

8. **Cost gate:** modeled round-trip cost (fees + spread/slippage + adverse
   selection) must be ≤ 20% of planned risk at signal time, or the entry is
   blocked and logged with its own gate-attribution code.
9. **Liquidity gates:** minimum volume and order-book quality requirements
   apply to every symbol; no sandbox exemptions in governed books.
10. **All expectancy figures are net of modeled costs**, with the gross/net
    decomposition retained so signal failures and cost failures are
    distinguishable.

## Measurement and reporting

11. **Full attribution logging:** signal components, MAE/MFE, slippage,
    fees, stop overshoot, exit reasons, and every skipped entry with its
    blocking gates and market context (breadth version, trust flags,
    concurrent benchmark equity).
12. **Paired experiments report both arms, same window, every report.**
    Entry and management effects are separated into A/B arms.
13. **Evaluation is sliced** by symbol, regime, session, and against
    benchmarks (BTC buy-and-hold and equal-weight scanned universe over the
    same window) — never aggregate P&L alone. Long-only results without a
    benchmark are uninterpretable.
14. **Headline totals must be reproducible** from explicitly defined books,
    date ranges, and trade-grain rules.
15. **Samples under 100 trades are labeled insufficient**; zero-trade books
    are labeled untested, not break-even. Early green results are not acted
    on (precedent: Ultra Aggressive, green at 46 trades, −$0.57/trade by 67).

## Risk controls (external to strategy code)

16. Daily loss halt (−1.5% equity, UTC day) and high-water drawdown kill
    switch (−15%) enforced in a layer no strategy can override; exits always
    remain active.
17. No daily profit targets, loss-recovery sizing, or martingale behavior in
    any form. Position risk is a fixed fraction of equity.
18. **Real-order path:** halted until a strategy passes the promotion gate.
    Exchange API keys remain read-only until the day of a deliberate,
    single-purpose promotion decision.

## Status at adoption

- Lead governed candidate: Three-Touch Reclaim v1 (paired arms; unmanaged
  arm registered 6 Aug 2026; risk-managed arm requires fresh registration —
  its 28 prior trades are exploratory).
- Other frozen clocks: Frontier v5, v4.2 Exit A/B, registered Pullback
  Reclaim/Maker pair, Top-10 Maker v1.
- Key finding to date: Top-10 Risk Sandbox showed positive gross expectancy
  (+$0.105/trade) consumed by costs (−$0.314/trade) — the one signal
  candidate; all other mature samples were negative before costs.
- Zero strategies validated; no live trading.
