# myoutreach/linkedin/tasks/connect.py
"""Connect task — resolves one candidate from the campaign pool and acts.

Lazy: the task payload carries only ``campaign_id``. The handler picks
its candidate at execution time via the campaign's ``ConnectStrategy``.
No self-rescheduling — pacing is owned by ``tasks/scheduler.py``.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Callable

from termcolor import colored

from myoutreach.core.db.deals import increment_connect_attempts, set_profile_state
from myoutreach.linkedin.db.leads import disqualify_lead
from myoutreach.linkedin.models import ActionLog
from linkedin_cli.enums import ProfileState
from linkedin_cli.exceptions import ProfileInaccessibleError, ReachedConnectionLimit, SkipProfile

logger = logging.getLogger(__name__)

MAX_CONNECT_ATTEMPTS = 3


@dataclass
class ConnectStrategy:
    find_candidate: Callable
    pre_connect: Callable | None
    qualifier: object


def strategy_for(campaign, qualifiers):
    """Build the right ConnectStrategy based on campaign type."""
    qualifier = qualifiers.get(campaign.pk)

    from myoutreach.linkedin.pipeline.pools import find_candidate

    return ConnectStrategy(
        find_candidate=lambda s: find_candidate(s, qualifier),
        pre_connect=None,
        qualifier=qualifier,
    )


def handle_connect(task, session, qualifiers):
    from linkedin_cli.actions.connect import send_connection_request
    from linkedin_cli.actions.status import get_connection_status

    campaign = session.campaign
    strategy = strategy_for(campaign, qualifiers)

    if not session.linkedin_profile.can_execute(ActionLog.ActionType.CONNECT):
        logger.info("[%s] connect: daily limit reached — slot skipped", campaign)
        return

    candidate = strategy.find_candidate(session)
    if candidate is None:
        logger.info("[%s] connect: no candidate available — slot skipped", campaign)
        return

    public_id = candidate["public_identifier"]
    profile = candidate.get("profile") or candidate

    # No pre-connect hook needed

    from myoutreach.crm.models import Deal

    deal = Deal.objects.filter(
        lead__public_identifier=public_id,
        campaign=session.campaign,
    ).first()
    reason = deal.reason if deal else ""
    stats = strategy.qualifier.explain(candidate, session) if strategy.qualifier else ""
    logger.info("[%s] %s", campaign, colored("▶ connect", "cyan", attrs=["bold"]))
    logger.info("[%s] %s (%s) — %s", campaign, public_id, stats, reason or "")

    try:
        status = get_connection_status(session, profile)

        if status in (ProfileState.CONNECTED, ProfileState.PENDING):
            # set_profile_state fires on_deal_state_entered, which stamps
            # next_check_pending_at on PENDING and no-ops on CONNECTED.
            set_profile_state(session, public_id, status.value)
            return

        # Do NOT send connection requests to new people
        logger.info("Outreach to new connections is disabled. Skipping connection request for %s", public_id)
        set_profile_state(session, public_id, ProfileState.FAILED.value, reason="New connection requests disabled")
        return



    except ReachedConnectionLimit as e:
        logger.warning("Rate limited: %s", e)
        session.linkedin_profile.mark_exhausted(ActionLog.ActionType.CONNECT)
    except ProfileInaccessibleError as e:
        logger.warning("Profile inaccessible — marking FAILED: %s", e)
        set_profile_state(session, public_id, ProfileState.FAILED.value,
                          reason=f"Profile inaccessible: {e}")
    except SkipProfile as e:
        logger.warning("Skipping %s: %s", public_id, e)
        set_profile_state(session, public_id, ProfileState.FAILED.value)
