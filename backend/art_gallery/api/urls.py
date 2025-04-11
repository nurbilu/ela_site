from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    UserViewSet, ArtPictureViewSet, CartViewSet, 
    OrderViewSet, MessageViewSet
)

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'art-pictures', ArtPictureViewSet)
router.register(r'carts', CartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'messages', MessageViewSet, basename='message')

# URL patterns for our API
urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # JWT authentication
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
] 