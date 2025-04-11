from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('art_gallery.api.urls')),
]

# Add media serving for development
if settings.DEBUG and getattr(settings, 'MEDIA_SERVING', False):
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 