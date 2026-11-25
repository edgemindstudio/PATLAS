"""
PATLAS — independent SciPy reference for the univariate Gaussian.

This script is used only for numerical verification. It is intentionally a
separate implementation from the TypeScript science module so that parity
failures reveal real disagreements rather than shared assumptions.

Input (stdin): {"cases": [{"mu": 0, "sigma": 1, "xs": [...]}, ...]}
Output (stdout): [{"mu": ..., "sigma": ..., "values": [...]}, ...]

Normalization is computed with scipy.integrate.quad over mu +/- 10 sigma.
"""

from __future__ import annotations

import json
import math
import sys
from typing import Any

from scipy.integrate import quad
from scipy.stats import norm


def pdf(x: float, mu: float, sigma: float) -> float:
    """Reference PDF using scipy.stats.norm."""
    return float(norm.pdf(x, loc=mu, scale=sigma))


def normalization_error(mu: float, sigma: float) -> float:
    """Absolute error of the integral over mu +/- 10 sigma."""
    lower = mu - 10.0 * sigma
    upper = mu + 10.0 * sigma
    value, _error = quad(
        lambda x: pdf(x, mu, sigma),
        lower,
        upper,
        epsabs=1e-13,
        epsrel=1e-13,
        limit=400,
    )
    return abs(value - 1.0)


def theoretical_tail_mass(sigma: float) -> float:
    """Mass outside mu +/- 10 sigma (two-sided), for disclosure in evidence."""
    return float(2.0 * norm.sf(10.0))


def run(cases: list[dict[str, Any]]) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for case in cases:
        mu = float(case["mu"])
        sigma = float(case["sigma"])
        if not math.isfinite(mu) or not math.isfinite(sigma) or sigma <= 0:
            raise ValueError("invalid Gaussian parameters")
        xs = [float(x) for x in case["xs"]]
        results.append(
            {
                "mu": mu,
                "sigma": sigma,
                "values": [pdf(x, mu, sigma) for x in xs],
                "normalization_error": normalization_error(mu, sigma),
            }
        )
    return results


def main() -> int:
    payload = json.load(sys.stdin)
    cases = payload.get("cases")
    if not isinstance(cases, list):
        raise SystemExit('expected {"cases": [...]} on stdin')
    json.dump(run(cases), sys.stdout)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
