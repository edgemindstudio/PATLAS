# Bernoulli educational requirements — consolidated record
PATLAS-BE-ERA-001 / PATLAS-BE-FA-001 | BED-001–005 confirmed | 2026-11-25
Registry source at ba0bc63b643c5e8d093bf2b642d44f10997cf500: id bernoulli, label Bernoulli, aliases [], status planned, placement discrete-distributions--bernoulli, order 0; Probability Distribution Models > Discrete Distributions. No identity change. All 14 sections applicable.

| Section | Required educational direction |
|---|---|
| Definition | One binary outcome |
| Motivation | Binary uncertainty |
| Visual intuition | Two probability bars |
| Structure | outcome space {0,1}, probability p in [0,1] |
| Symbols/equations | PMF, CDF, moments, likelihood |
| Derivation | normalization, moments, MLE |
| Interactive experiment | single PMF/CDF lab |
| Fitting/inference/sampling | binary draws, sample proportion, exact interval, Beta conjugacy |
| Code | snapshot and local companion |
| Applications | quality, reliability, classification conditional on input |
| Assumptions/limitations | binary encoding; iid/common p for repeated trials only |
| Related models | Binomial, Categorical, Beta, Bernoulli mixture |
| Knowledge check | masses, variance, MLE, endpoints, uncertainty |
| References | scientific and computational claim mapping |

## Mathematical contract
PMF(0)=1-p, PMF(1)=p, zero otherwise for finite real x. CDF(t)=0 below 0, 1-p on [0,1), 1 at and above 1. Right-continuous. Mean p, variance p(1-p), total mass 1; max variance .25 at .5. Endpoints valid deterministic distributions. Piecewise PMF avoids ambiguous 0^0. Outcome space unchanged; positive mass support shrinks at endpoints. Fit iid binary observations by S/n, S=sum(x), n>0. Likelihood p^S(1-p)^(n-S); interior derivative yields MLE, all-zero/all-one samples maximize at valid endpoints. Reject empty/nonbinary samples. Var(MLE)=p(1-p)/n. Sampling via U<p or NumPy Generator(PCG64(seed)).binomial(1,p,size=n). Proposed example seed 42, n=100,p=.7; observed proportion need not equal p. Exact Clopper–Pearson confidence interval with repeated-sampling interpretation, conservative; no zero-width Wald interval at endpoint. Beta(alpha,beta) prior with positive shape parameters, posterior Beta(alpha+S,beta+n-S); Beta(1,1) + 7 successes/3 failures yields Beta(8,4), posterior mean 2/3. Distinguish likelihood from posterior and distribution of X from uncertainty about p.

## Lab and code
Proposed lab ID bernoulli-pmf-cdf; slider/numeric p [0,1], step .01, default .5; PMF bars, CDF right-continuous steps with open/closed endpoints and no artificial jumps at zero mass, fixed y [0,1]. View switching preserves p; reset restores .5 and PMF; invalid draft retains applied value. Show mean, variance, total mass, numeric/accessibility alternatives; guided .2/.8, .5, 0,1. Deterministic lab seed N/A. Export both views using current applied p, SciPy bernoulli PMF/CDF/stats; local companion with PCG64, fitting, binomtest.proportion_ci(method='exact'), Beta posterior. Declared pinned environment. No mandatory browser sampling/fitting/inference or interactive quiz engine. Prerequisites probability, random variables, expectation, variance, independence, optional logs; inline explanations where pages planned. Related IDs binomial, categorical, beta, bernoulli-mixture-model; relationship edges remain candidates, no runtime change. A mixture of scalar Bernoullis marginalizes to Bernoulli with weighted p; meaningful latent structure requires richer observations or shared component.

## Verification direction
10 p values: 0,.01,.1,.25,.5,.7,.75,.9,.99,1; x=-1,0,.5,1,2. 50 PMF +50 CDF +10 mean +10 variance =120 comparisons. Proposed abs tolerance 1e-12, normalization 1e-12, deterministic endpoints exact. Final fixtures and explicit nonfinite evaluation policy require plan review; math accepts off-grid p, UI restricts grid. Test near discontinuities, endpoint behavior, monotonicity, variance bounds/symmetry, invalid input; exact observation counts and deterministic replay in pinned environment. Fit [0,1,1,0,1] gives .6; endpoint and single observation valid; empty/nonbinary reject. Verify interval against analytic or independent numerical values (not same function twice) and Beta(8,4). Verify actual downloads, keyboard, contrast, both themes, native zoom, screen reader and responsive layout; no inherited M001 waivers. No tests run; full module planned.

## Reference candidates (from prior assessment, not freshly rechecked)
- SciPy bernoulli: https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.bernoulli.html
- Penn State STAT504: https://online.stat.psu.edu/stat504/Lesson01 and Lesson02
- NIST confidence intervals: https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm
- Beta-Bernoulli: https://bookdown.org/kevin_davisross/bayesian-reasoning-and-methods/continuous-distributions-for-a-population-proportion.html
- NumPy generator: https://numpy.org/doc/stable/reference/random/generator.html
- SciPy binomtest: https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.binomtest.html
- Murphy, Probabilistic Machine Learning: An Introduction (2022), claim mapping pending.
