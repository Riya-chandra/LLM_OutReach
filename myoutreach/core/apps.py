# myoutreach/core/apps.py
from django.apps import AppConfig


class CoreConfig(AppConfig):
    name = "myoutreach.core"
    label = "core"
    default_auto_field = "django.db.models.BigAutoField"
