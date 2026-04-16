## Predictions vs Actuals

| Metric | Predicted | Actual | Verdict |
|--------|-----------|--------|---------|
| Total corners | 7–13 (central 9.25) | 18 | **Miss** (+8.75, ~2.8σ above Poisson mean) |
| Arsenal corners won | 5.75 (range 3–9) | 10 | **Miss** (+4.25, above stated range) |
| Leverkusen corners won | 3.5 (range 1–7) | 8 | **Miss** (+4.5, above stated range) |
| Corner spread (A−B) | +2.25 | +2 | **Hit** (0.25 off) |

| # | Pick | Line | Odds | Pred Prob | Actual | Outcome |
|---|------|------|------|-----------|--------|---------|
| 1 | Arsenal Team Under | 6.5 | −140 | 65% | 10 | **LOSS** |
| 2 | Total Under | 10.5 | 1.53 | 67% | 18 | **LOSS** |
| 3 | Leverkusen Spread | +3.5 | −140 | 63% | +2 | **WIN** |

Net: 1–2. The stated correlation warning was prescient — the two correlated picks (Arsenal Under, Total Under) failed together, while the diversifying pick (Leverkusen +3.5) won.

## What Worked

**Corner spread (+2.25 predicted, +2 actual).** The single-number spread estimate was almost exact.

- **Skill vs luck**: Mostly skill, but partially coincidental. The analysis correctly identified that Leverkusen's 3-4-2-1 with Grimaldo delivery and wing-back width would generate more corners than a typical Arsenal away visitor (model output 3.5, book centre 3.38). The final spread (+2) matched because *both teams overshot proportionally* — Arsenal 10 vs predicted 5.75, Leverkusen 8 vs predicted 3.5. The ratio was preserved even though the magnitudes were both wrong. A single large error in either direction would have broken the pick.
- **Repeatable edge**: The *structural insight* (Leverkusen's wing-back system generates corners even vs strong opponents) is repeatable. The *spread hitting exactly* is partly luck — when both totals miss by similar magnitudes, the spread stays tight by coincidence. Future spread picks should still carry the correlation warning.

**Leverkusen's late attacking phase recognised.** The analysis flagged "if Arsenal score first, Leverkusen must push forward." This happened: 4 of Leverkusen's 8 corners came at 2–0 down from 72' onward, exactly the game-state dynamic predicted.

## What Missed

**Under 10.5 total (predicted 67% Under, actual 18 corners — blown by 7.5).**

- **Root cause — Weighting error (primary)**: First-leg anchor was weighted too heavily. The 5-corner first leg was treated as "the most relevant data point" with high personnel overlap, but the contexts were structurally different: BayArena (Leverkusen home), first-leg conservatism, Arsenal without clear aggressive template. The second leg was at home, aggregate-tied, with Arteta's stated intent to attack. The analysis acknowledged these differences but applied only a +0.5 uplift — far too small given the magnitude of context shift.
- **Root cause — Model error (secondary)**: Poisson was chosen based on variance ≈ mean. But Arsenal home variance is 11.95 (SD ~3.5), which means the right-tail is fatter than Poisson allows. The caveat section flagged this ("Poisson underestimates tail probabilities") but the pick was still sized at 7/10 confidence. A 2.8σ outcome is exactly the kind of tail Poisson underweights.
- **Predictable?** Partially. The "set-piece FC" identity of Arsenal (20+ set-piece goals season-wide, 16 PL corner goals) was knowable and should have shifted the prior. Hincapié's pre-match quote ("set-piece strength talked about all over Europe") was reported context — the analysis focused on defensive organisation rather than asking *why Leverkusen were so worried*.

**Arsenal Under 6.5 (predicted 65%, actual 10).**

- **Root cause — Weighting error**: Leaned on "Arsenal's home median is 5" and "only twice did Arsenal exceed 6 at home." But the two exceptions (Man Utd 9, Brighton 7) shared a feature with this game: sustained first-half pressure at 0–0 against a team that defended deep. Arsenal took 7 corners in the first half alone — the game-state (0–0 siege at home, CL knockout) was exactly the "outlier" profile, not the median profile.
- **Root cause — Data gap (minor)**: Arsenal's March 14 Everton data was missing, as noted in caveats. Not decisive but would have informed recent set-piece volume.
- **Predictable?** Yes. The analysis identified the correct mechanism ("Arsenal's highest corner games at home coincided with competitive score-states") and then failed to apply it to a CL knockout at 1–1 aggregate, which is the competitive home game par excellence.

**Leverkusen won 8 corners (predicted 3.5).**

- **Root cause — Weighting error**: The core premise — "Arsenal's home territorial dominance holds opponents to 0–2 corners" — was anchored on Liverpool (0), Man Utd (2), and non-top-six visitors. The Chelsea 10 was treated as an outlier. But Leverkusen at 0–2 down in a CL knockout is closer to the Chelsea profile (team must attack) than the Liverpool profile (tactical draw). The 40/60 weighting toward Arsenal's defensive record was too aggressive.
- **Root cause — Unforeseen game flow (minor)**: Arsenal scoring twice (63', later) forced Leverkusen into a sustained late chase with 68% possession in the 2nd half. This amplified but did not cause the miss — Leverkusen already had 3 corners in the first half, on track for 6+ regardless.
- **Predictable?** Partially. The "must-attack" dynamic was named in the analysis but not quantitatively incorporated into Leverkusen's projection.

## Key Learnings

1. **In two-legged knockouts with aggregate tied, treat the home leg as a "must-attack" game for both sides, not as a typical home fixture.** The first leg's cagey 5-corner total should be a *ceiling* reference for the second leg's opening phase, not an anchor for the whole 90 minutes. Apply uplift of +2 to +3 total corners for CL knockout home legs with tied aggregate, not +0.5.

2. **When a team is explicitly identified as "set-piece FC" by public commentary, weight corner-generation factors higher than statistical anchors.** Arsenal's 20+ set-piece goals and the opposition's pre-match set-piece-avoidance quotes were stronger evidence than the last-20 per-game median. Public tactical identity beats small-sample median when the sample is composed of varied score-states.

3. **Arsenal's home median (5) and upper quartile (9) describe different games — identify which profile this match fits before using the median.** Games at 0–0 with Arsenal chasing at home reliably cluster in the upper quartile. Pre-match, ask "is this likely to be a siege game?" and use the upper quartile if yes.

4. **The "top-six visitors get 0–2 corners at Arsenal" heuristic breaks when the visitor must attack to chase a result.** Liverpool 0 and Man Utd 2 were games where the visitor could accept a draw or low-corner loss. Leverkusen had no such option at 0–0 needing a goal, and especially at 0–2 needing three.

5. **Poisson confidence should be discounted by at least 5% on total-corner picks when either team's variance/mean ratio >1.2.** The caveat was noted but not incorporated into pick sizing. Make this mechanical: if variance/mean > 1.2, cap confidence at 5/10 even with apparent edge.

6. **Correlated picks should be sized as one bet, not discussed as "portfolio diversification."** Pick 1 and Pick 2 shared the same underlying thesis (Arsenal/total both low). The mitigation should have been to drop one, not flag it. When both depend on the same latent variable (Arsenal's corner output), they are one bet.

## Market-Specific Insights

### Corner Patterns Observed

- **Arsenal's 10 corners were heavily front-loaded**: 7 in the first half, including a 5-minute cluster (16'–21') and a back-to-back (28'–29'). This is a siege pattern — classic Arsenal at 0–0 at home.
- **Set-piece routines went as telegraphed**: Saka inswinger → Gabriel near-post run appeared at 9' and 21'. The Saka → Trossard short variation at 28' produced the match's most dangerous sequence (two saves). Leverkusen knew what was coming and still struggled.
- **Leverkusen's corners were bimodal**: 3 in the first half (opportunistic, from blocked clearances) and 5 late (72', 74', 74', 79', 90+3') once chasing 0–2. The 72'–74' cluster was their only genuine attacking pressure phase.
- **Delivery concentration**: All 8 Leverkusen corners went through Grimaldo (left foot, outswinging). Predictable but near produced an own goal at 73' off Saliba's knee.

### Defensive/Offensive Trends

- **Leverkusen's 3-4-2-1 did not limit Arsenal's corner generation** — the opposite. Wing-back defence left Saka with repeated byline opportunities on Arsenal's right. The prediction that the 3-at-the-back "provides width to defend crosses" was wrong; it provided space for inswingers.
- **Arsenal's press created the first-half siege**: Leverkusen managed only 2 first-half shots despite 49% possession. The corner cluster reflected trapped opposition rather than just Arsenal's attacking quality.
- **Second-half substitution dynamics favoured Leverkusen's corner count**: once Arsenal led 2–0, they ceded 68% possession and their corner rate dropped (3 in 2nd half vs 7 in 1st). This is the mirror of the Aston Villa H game (led 1-0 at HT, 6 total).

### Bookmaker Line Assessment

- **The book (Pinnacle 9.5 line, effectively 9.75 centre) was far closer to reality than the model** (9.25 centre). Actual was 18. Both missed, but the book missed by less.
- **Arsenal team corner centre (~6.3) was substantially closer** to actual (10) than the model's 5.75. The market had more respect for the home siege dynamic than the pure statistical anchor.
- **Market efficiency takeaway**: When sharp books (Pinnacle, DraftKings) consistently set centres 0.5–0.75 *above* a statistical model in a high-profile knockout, that gap is likely encoding game-state priors the model is missing. Treat persistent book-vs-model gaps in knockout fixtures as signal, not noise.
- **The spread line (+3.5) was correctly priced close to the true median** (~+2.5 to +3.0), which is why it won despite the overall prediction failing — spread is more robust to shared magnitude errors than totals.