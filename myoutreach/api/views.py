import json
import os
import subprocess
import sys
from pathlib import Path

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PID_FILE = BASE_DIR / "data" / "daemon.pid"
LOG_FILE = BASE_DIR / "data" / "daemon.log"
PYTHON = str(BASE_DIR / ".venv" / ("Scripts" if sys.platform == "win32" else "bin") / ("python.exe" if sys.platform == "win32" else "python"))


def _read_pid():
    if PID_FILE.exists():
        try:
            return int(PID_FILE.read_text().strip())
        except (ValueError, FileNotFoundError):
            pass
    return None


def _is_running(pid):
    if pid is None:
        return False
    if sys.platform == "win32":
        result = subprocess.run(
            ["tasklist", "/FI", f"PID eq {pid}", "/NH", "/FO", "CSV"],
            capture_output=True, text=True,
        )
        return str(pid) in result.stdout
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


@csrf_exempt
def daemon_start(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    pid = _read_pid()
    if _is_running(pid):
        return JsonResponse({"status": "already_running", "pid": pid})
    LOG_FILE.parent.mkdir(exist_ok=True)
    log_f = open(LOG_FILE, "a", buffering=1, encoding="utf-8")
    proc = subprocess.Popen(
        [PYTHON, "manage.py", "rundaemon"],
        cwd=str(BASE_DIR),
        stdout=log_f,
        stderr=log_f,
    )
    PID_FILE.write_text(str(proc.pid))
    return JsonResponse({"status": "started", "pid": proc.pid})


@csrf_exempt
def daemon_stop(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    pid = _read_pid()
    if not _is_running(pid):
        try:
            PID_FILE.unlink(missing_ok=True)
        except Exception:
            pass
        return JsonResponse({"status": "not_running"})
    if sys.platform == "win32":
        subprocess.run(["taskkill", "/F", "/PID", str(pid)], capture_output=True)
    else:
        os.kill(pid, 15)
    try:
        PID_FILE.unlink(missing_ok=True)
    except Exception:
        pass
    return JsonResponse({"status": "stopped", "pid": pid})


def daemon_status(request):
    pid = _read_pid()
    running = _is_running(pid)
    if not running:
        try:
            PID_FILE.unlink(missing_ok=True)
        except Exception:
            pass

    stats = {"leads": 0, "connected": 0, "pending": 0, "completed": 0, "failed": 0}
    try:
        from myoutreach.crm.models import Deal
        from linkedin_cli.enums import ProfileState
        for state in Deal.objects.values_list("state", flat=True):
            stats["leads"] += 1
            if state == ProfileState.CONNECTED:
                stats["connected"] += 1
            elif state == ProfileState.PENDING:
                stats["pending"] += 1
            elif state == ProfileState.COMPLETED:
                stats["completed"] += 1
            elif state == ProfileState.FAILED:
                stats["failed"] += 1
    except Exception:
        pass

    return JsonResponse({"running": running, "pid": pid if running else None, "stats": stats})


def daemon_logs(request):
    n = int(request.GET.get("lines", 150))
    if not LOG_FILE.exists():
        return JsonResponse({"lines": ["No logs yet. Start the daemon to see output."]})
    try:
        with open(LOG_FILE, "r", encoding="utf-8", errors="replace") as f:
            all_lines = f.readlines()
        return JsonResponse({"lines": [ln.rstrip() for ln in all_lines[-n:]]})
    except Exception as e:
        return JsonResponse({"lines": [], "error": str(e)})


def get_config(request):
    try:
        from myoutreach.core.models import SiteConfig, Campaign
        from myoutreach.linkedin.models import LinkedInProfile
        cfg = SiteConfig.load()
        campaigns = list(Campaign.objects.values("id", "name", "campaign_objective", "product_docs", "booking_link"))
        profiles = list(LinkedInProfile.objects.values("id", "linkedin_username", "connect_daily_limit", "follow_up_daily_limit"))
        return JsonResponse({
            "llm_provider": cfg.llm_provider,
            "ai_model": cfg.ai_model,
            "llm_api_base": cfg.llm_api_base or "",
            "has_api_key": bool(cfg.llm_api_key),
            "campaigns": campaigns,
            "profiles": profiles,
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def save_llm_config(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body)
        from myoutreach.core.models import SiteConfig
        cfg = SiteConfig.load()
        for field in ("llm_provider", "llm_api_key", "ai_model", "llm_api_base"):
            if data.get(field):
                setattr(cfg, field, data[field])
        cfg.save()
        return JsonResponse({"status": "saved"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def save_campaign(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body)
        from myoutreach.core.models import Campaign
        from django.contrib.auth.models import User
        name = data.get("name", "My Campaign")
        campaign, created = Campaign.objects.get_or_create(name=name)
        campaign.product_docs = data.get("product_docs", "")
        campaign.campaign_objective = data.get("campaign_objective", "")
        campaign.booking_link = data.get("booking_link", "")
        campaign.save()
        for user in User.objects.filter(is_superuser=True):
            campaign.users.add(user)
        return JsonResponse({"status": "saved", "id": campaign.pk, "created": created})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def save_linkedin_profile(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body)
        from myoutreach.linkedin.models import LinkedInProfile
        from django.contrib.auth.models import User
        email = data.get("linkedin_email", "")
        password = data.get("linkedin_password", "")
        if not email or not password:
            return JsonResponse({"error": "email and password required"}, status=400)
        username = email.split("@")[0].replace(".", "_").lower()[:30]
        user, _ = User.objects.get_or_create(username=username)
        user.set_unusable_password()
        user.save()
        profile, created = LinkedInProfile.objects.get_or_create(user=user)
        profile.linkedin_username = email
        profile.linkedin_password = password
        profile.connect_daily_limit = int(data.get("connect_daily_limit", 20))
        profile.follow_up_daily_limit = int(data.get("follow_up_daily_limit", 20))
        profile.save()
        return JsonResponse({"status": "saved", "created": created})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
