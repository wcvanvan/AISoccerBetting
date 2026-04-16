## Predictions vs Actuals

| Metric | Predicted | Actual | Verdict |
|--------|-----------|--------|---------|
| Total corners | 9–14 (central 11.0) | 12 | Hit |
| Chelsea corners won | 7.5 (range 4–12) | 9 | Hit (+1.5 vs central) |
| PSG corners won | 4.0 (range 1–7) | 3 | Hit (−1.0 vs central) |
| Corner spread (CHE−PSG) | −3.0 (range 0 to −8) | −6 | Hit (Chelsea dominated more) |

| # | Pick | Line | Odds | Est. Prob | Result | Outcome |
|---|------|------|------|-----------|--------|---------|
| 1 | Total Corners Over | 10.5 | 2.14 | 54% | 12 corners | **WIN** |
| 2 | Total Corners Over | 9.5 | 1.72 | 66% | 12 corners | **WIN** |
| 3 | Total Corners Over | 11.5 | 2.78 | 42% | 12 corners | **WIN** |

All three value picks cashed. The total (12) sat comfortably above the highest line played.

## What Worked

**Chelsea home corner dominance thesis validated.** Predicted Chelsea would win 7.5, actual 9. The core reasoning — that Chelsea's desperate attacking posture would replicate the West Ham/Bournemouth/Burnley home templates — played out exactly. Chelsea generated 9 first-half corners while chasing the tie, matching the "when Chelsea trail, they press and produce corners" pattern identified pre-match (West Ham H: 9 CW from 0-2 down).

- **Skill vs luck**: Largely skill. The factors identified (fullbacks high, sustained crossing, trailing game-state amplifying press) all materialized. The clustering at 9', 25', 42' shows exactly the "sustained pressure → blocked delivery → recycled corner" mechanism the analysis anticipated.
- **Repeatable edge**: Yes. The "home team trailing in high-stakes knockout → inflated home corner count" pattern is a repeatable structural edge, particularly when the book appears to price both teams closer to their season averages rather than context-adjusted projections.

**PSG corner suppression was close to exact.** Predicted 4.0, actual 3. The "managed game" profile (CW ~3.5) from comfortable PSG wins was a better reference than their CL-knockout average (CW ~8). Luis Enrique's absorb-and-counter plan produced exactly the predicted profile: 1 first-half counter-attack corner + 2 late corners after Chelsea opened up.

- **Skill vs luck**: Skill. The reasoning that PSG's 6.20 away CW was inflated by urgency-games and that the 3-goal cushion would revert them toward 3.5 proved correct.

**Total reconciliation was accurate.** Predicted 11.0, actual 12. The +1.0 context adjustment above the book's ~10.0 centre captured real edge. The Poisson(λ=11) model was well-calibrated despite the underdispersion note.

## What Missed

Nothing missed at the bet-resolution level — all three picks won. However, the **second-half corner distribution was a significant under-forecast**:

- **Predicted implicitly**: corners distributed roughly evenly across halves, with possible fade in the final 20–30 minutes per Caveat #6 (fatigue).
- **Actual**: 10 first-half corners, 2 second-half corners. Chelsea produced **zero** corners after half-time despite taking 9 shots.

**Root cause**: Mixed. Partly unforeseen game flow (Chelsea effectively gave up after conceding the second, abandoning wide crossing — 2 accurate crosses in H1 vs **zero** in H2). Partly the fatigue factor flagged in Caveat #6 materializing more severely than expected — Chelsea's 3-day turnaround vs PSG's postponed-fixture freshness showed up starkly. Partly PSG tactical: their 2H possession jumped to 60% with 271 accurate passes, strangling Chelsea's ability to even reach the final third to draw blocks.

This was predictable — the caveat identified the risk, it just materialized with higher magnitude (10→2 split rather than the gentler 7→4 kind of fade implicitly modelled).

## Key Learnings

1. **Corner markets front-load sharply in knockout chase scenarios.** Chelsea produced 83% of their corners in the first half. For live-betting applications, the implicit advice is that most of the corner total is locked in by HT in these contexts — the value in pre-match Overs comes from the first half, not a smooth distribution. Future analyses should explicitly model a first-half corner estimate separately from the full match when game-state pressure is one-directional.

2. **The "trailing team generates corners" pattern is strongest when tactical hope remains.** Once PSG went 0-2 (and especially 0-3), Chelsea stopped crossing entirely (zero accurate crosses in H2). Corner generation requires not just desperation but belief — when a tie becomes mathematically implausible, the crossing volume collapses. This is a nuance to add to the current "trailing → corners" heuristic.

3. **PSG's "managed game" CW of ~3.5 is a reliable reference when they hold a 2+ goal lead.** This tick is confirmed against another data point (actual 3 CW here). Future PSG-as-favourite-with-cushion scenarios should lean on this sub-profile rather than their season-wide 6.15.

4. **First-contact defensive quality is a corner-outcome variable worth modelling.** All 5 of Chelsea's "dangerous" corners produced shots that were blocked on the edge or saved from close range — zero goals. Future corner-related markets (corner-to-goal conversion, asian corner handicaps) should factor defensive set-piece profile, not just volume.

5. **Rest differential amplifies second-half fade more than linearly.** A 3-day vs 6-day gap produced a dramatic corner cliff. Past analyses have treated this as a mild adjustment; this match suggests the effect is larger and should be weighted more heavily, particularly for totals markets where second-half production is in question.

6. **H2H discount decision was correct.** The first leg (5 total corners) was heavily discounted and this call was vindicated — second leg produced 12 despite high personnel overlap. Tactical context dominates roster continuity for corner projections.

## Market-Specific Insights

### Corner Patterns Observed
Corners clustered in **three distinct pairs** (9', 25', 42') — each pair a first-phase delivery blocked behind for a recycled corner. This explains the ratio of 9 Chelsea corners producing only ~5 shot attempts: second-phase corners rarely generated a follow-up shot (3/5 recycled corners produced nothing). PSG's first-contact defending was excellent; Chalobah's 9' header was the only true first-contact chance Chelsea generated from a set-piece.

Delivery patterns weren't captured in available sources, but the low cross accuracy (2 accurate crosses in H1, 0 in H2) combined with the recycled-corner pattern suggests Chelsea favoured in-swinging crosses to the near post that PSG defended comfortably.

### Defensive/Offensive Trends
PSG's **22 first-half clearances** (vs Chelsea's 2) signals a deliberate "clear long" defensive shape — no attempt to play out from pressure, just reset the defensive line. This is consistent with the "absorb and counter" game plan and with the corner-conceding pattern: PSG were content to concede corners rather than risk short recycling that could break their defensive shape.

Chelsea's sub-pattern also informed: early attacking substitutions didn't re-energize corner production because the crossing volume had already collapsed. Once the crosses stopped, no substitution restored them.

### Bookmaker Line Assessment
The lines were **moderately soft** on totals. The book's ~10.0 centre underpriced Chelsea's home corner propensity by ~1.0 corners, creating 8–11% edges across Over 9.5/10.5/11.5. Pinnacle's Over 10.5 at 2.14 (44.3% fair) was the sharpest mispricing — a true ~54% proposition priced at 44%.

The spread lines, by contrast, were efficiently priced: my pre-match analysis identified <2% edges, and the actual −6 spread was an extreme realization that the Skellam variance (SD 3.3) correctly framed as within tail probability rather than a systematic mispricing. Had I stretched to take Chelsea −2.5, it would have won handsomely — but the EV case wasn't there pre-match, and this was a variance-friendly outcome, not a predictable one.

Market efficiency observation: spreads were sharp, totals were soft. This is a useful structural takeaway — corner markets tend to have more edge in totals than in handicaps, likely because total-corner modelling requires context adjustment (game state, motivation) that bookmaker models under-capture.