"""Independent numerical checks for the PATLAS Gaussian reference."""

from __future__ import annotations

import math

import pytest
from scipy.stats import norm

from gaussian_reference import normalization_error, pdf, run


def test_pdf_matches_closed_form() -> None:
    assert pdf(0.0, 0.0, 1.0) == pytest.approx(1.0 / math.sqrt(2.0 * math.pi), abs=1e-15)
    assert pdf(2.0, 2.0, 3.0) == pytest.approx(
        1.0 / (3.0 * math.sqrt(2.0 * math.pi)), abs=1e-15
    )


def test_symmetry_around_the_mean() -> None:
    for mu, sigma in [(-3.0, 0.5), (3.0, 2.5), (0.0, 1.0), (0.7, 1.3)]:
        for offset in [0.1, 0.7, 2.0, 5.0]:
            assert pdf(mu + offset, mu, sigma) == pytest.approx(
                pdf(mu - offset, mu, sigma), abs=1e-15
            )


def test_normalization_over_ten_sigma() -> None:
    for mu, sigma in [(0.0, 1.0), (-3.0, 0.5), (3.0, 2.5), (-1.7, 0.8)]:
        assert normalization_error(mu, sigma) <= 1e-6


def test_invalid_parameters_are_rejected() -> None:
    for mu, sigma in [(0.0, 0.0), (0.0, -1.0), (float("nan"), 1.0), (0.0, float("inf"))]:
        with pytest.raises(ValueError):
            run([{"mu": mu, "sigma": sigma, "xs": [0.0]}])


def test_reference_uses_scipy_norm() -> None:
    xs = [-12.0, -1.0, 0.0, 1.0, 12.0]
    result = run([{"mu": 0.0, "sigma": 1.0, "xs": xs}])[0]
    assert result["values"] == pytest.approx(list(norm.pdf(xs)), abs=1e-15)
