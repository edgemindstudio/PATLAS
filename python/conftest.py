"""Test configuration for the isolated PATLAS Python reference."""

from __future__ import annotations

import sys
from pathlib import Path

REFERENCE_DIR = Path(__file__).resolve().parent / "reference"
if str(REFERENCE_DIR) not in sys.path:
    sys.path.insert(0, str(REFERENCE_DIR))
