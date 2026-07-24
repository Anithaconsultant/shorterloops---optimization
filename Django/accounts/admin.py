from django.contrib import admin
# from auditlog.admin import LogEntryAdmin as BaseLogEntryAdmin
# from auditlog.models import LogEntry
# from accounts.models import Asset
# class CustomLogEntryAdmin(BaseLogEntryAdmin):
#     list_display = list(BaseLogEntryAdmin.list_display) + ['correlation_id']

#     def correlation_id(self, obj):
#         return obj.Asset.correlation_id  # Assuming 'correlation_id' is the name of the correlation ID field in your model
    
#     correlation_id.short_description = 'Correlation ID'

# # Unregister the default LogEntryAdmin provided by django-auditlog
# admin.site.unregister(LogEntry)

# # Register your custom LogEntryAdmin
# admin.site.register(LogEntry, CustomLogEntryAdmin)
