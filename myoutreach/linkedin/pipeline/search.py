# myoutreach/linkedin/pipeline/search.py
"""Search keyword management and LinkedIn People search."""
from __future__ import annotations

import logging

from django.utils import timezone
from termcolor import colored

logger = logging.getLogger(__name__)


def run_search(session) -> str | None:
    """Use the next search keyword to discover new profiles. Returns keyword or None."""
    logger.info("Search for new profiles is disabled.")
    return None
