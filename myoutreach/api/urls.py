from django.urls import path
from . import views

urlpatterns = [
    path("status/", views.daemon_status),
    path("logs/", views.daemon_logs),
    path("daemon/start/", views.daemon_start),
    path("daemon/stop/", views.daemon_stop),
    path("config/", views.get_config),
    path("config/llm/", views.save_llm_config),
    path("config/campaign/", views.save_campaign),
    path("config/linkedin/", views.save_linkedin_profile),
]
