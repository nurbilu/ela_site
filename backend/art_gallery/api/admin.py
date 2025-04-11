from django.contrib import admin
from .models import ArtPicture, Cart, CartItem, Order, OrderItem, Message

@admin.register(ArtPicture)
class ArtPictureAdmin(admin.ModelAdmin):
    list_display = ('title', 'price', 'is_available', 'created_at')
    list_filter = ('is_available', 'created_at')
    search_fields = ('title', 'description')

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at', 'updated_at')
    search_fields = ('user__username',)

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'art_picture', 'quantity', 'added_at')
    search_fields = ('cart__user__username', 'art_picture__title')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'user', 'status', 'payment_method', 'total_price', 'created_at')
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = ('order_number', 'user__username')
    readonly_fields = ('order_number', 'created_at', 'paid_at')

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'art_picture', 'price', 'quantity')
    search_fields = ('order__order_number', 'art_picture__title')

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('subject', 'sender', 'recipient', 'message_type', 'is_read', 'created_at')
    list_filter = ('message_type', 'is_read', 'created_at')
    search_fields = ('subject', 'content', 'sender__username', 'recipient__username') 