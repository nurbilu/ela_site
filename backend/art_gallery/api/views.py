from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db import transaction

import stripe
from django.conf import settings

from .models import ArtPicture, Cart, CartItem, Order, OrderItem, Message
from .serializers import (
    UserSerializer, ArtPictureSerializer, CartSerializer, CartItemSerializer,
    OrderSerializer, OrderItemSerializer, MessageSerializer
)

# Configure Stripe API key
stripe.api_key = settings.STRIPE_API_KEY

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit objects,
    but allow anyone to view them.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff

class UserViewSet(viewsets.ModelViewSet):
    """API endpoint for users"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [IsAdminUser()]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)

class ArtPictureViewSet(viewsets.ModelViewSet):
    """API endpoint for art pictures"""
    queryset = ArtPicture.objects.all()
    serializer_class = ArtPictureSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_queryset(self):
        queryset = ArtPicture.objects.all()
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_available=True)
        return queryset

class CartViewSet(viewsets.ModelViewSet):
    """API endpoint for shopping carts"""
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_cart(self, request):
        """Get or create the current user's cart"""
        cart, created = Cart.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(cart)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def add_item(self, request):
        """Add an item to the cart"""
        cart, created = Cart.objects.get_or_create(user=request.user)
        art_picture_id = request.data.get('art_picture_id')
        quantity = int(request.data.get('quantity', 1))
        
        try:
            art_picture = ArtPicture.objects.get(pk=art_picture_id, is_available=True)
        except ArtPicture.DoesNotExist:
            return Response(
                {'error': 'Art picture not found or not available'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            art_picture=art_picture,
            defaults={'quantity': quantity}
        )
        
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        
        serializer = CartSerializer(cart)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        """Remove an item from the cart"""
        cart = get_object_or_404(Cart, user=request.user)
        item_id = request.data.get('item_id')
        
        try:
            cart_item = CartItem.objects.get(pk=item_id, cart=cart)
            cart_item.delete()
            return Response(
                {'success': 'Item removed from cart'},
                status=status.HTTP_200_OK
            )
        except CartItem.DoesNotExist:
            return Response(
                {'error': 'Item not found in cart'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def update_item_quantity(self, request):
        """Update the quantity of an item in the cart"""
        cart = get_object_or_404(Cart, user=request.user)
        item_id = request.data.get('item_id')
        quantity = int(request.data.get('quantity', 1))
        
        if quantity <= 0:
            return Response(
                {'error': 'Quantity must be positive'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            cart_item = CartItem.objects.get(pk=item_id, cart=cart)
            cart_item.quantity = quantity
            cart_item.save()
            
            serializer = CartItemSerializer(cart_item)
            return Response(serializer.data)
        except CartItem.DoesNotExist:
            return Response(
                {'error': 'Item not found in cart'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def clear(self, request):
        """Clear all items from the cart"""
        cart = get_object_or_404(Cart, user=request.user)
        CartItem.objects.filter(cart=cart).delete()
        return Response(
            {'success': 'Cart cleared'},
            status=status.HTTP_200_OK
        )

class OrderViewSet(viewsets.ModelViewSet):
    """API endpoint for orders"""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.all()
        return Order.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def checkout(self, request):
        """Checkout process - create order from cart"""
        cart = get_object_or_404(Cart, user=request.user)
        cart_items = CartItem.objects.filter(cart=cart)
        
        if not cart_items.exists():
            return Response(
                {'error': 'Your cart is empty'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        shipping_address = request.data.get('shipping_address')
        billing_address = request.data.get('billing_address')
        payment_method = request.data.get('payment_method')
        
        if not all([shipping_address, billing_address, payment_method]):
            return Response(
                {'error': 'Missing required checkout information'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        total_price = sum(item.art_picture.price * item.quantity for item in cart_items)
        
        with transaction.atomic():
            # Create the order
            order = Order.objects.create(
                user=request.user,
                payment_method=payment_method,
                shipping_address=shipping_address,
                billing_address=billing_address,
                total_price=total_price
            )
            
            # Create order items
            for cart_item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    art_picture=cart_item.art_picture,
                    price=cart_item.art_picture.price,
                    quantity=cart_item.quantity
                )
            
            # Clear the cart
            cart_items.delete()
        
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def process_payment(self, request, pk=None):
        """Process payment for an order"""
        order = self.get_object()
        
        if order.status != 'pending':
            return Response(
                {'error': 'This order has already been processed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        token = request.data.get('token')
        payment_method = order.payment_method
        
        if not token:
            return Response(
                {'error': 'Payment token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            if payment_method == 'credit_card':
                # Process with Stripe
                charge = stripe.Charge.create(
                    amount=int(order.total_price * 100),  # Convert to cents
                    currency='usd',
                    description=f'Order {order.order_number}',
                    source=token
                )
                
                # Save payment information
                order.payment_id = charge.id
                order.mark_as_paid()
                
                return Response(
                    {'success': 'Payment processed successfully'},
                    status=status.HTTP_200_OK
                )
            
            elif payment_method == 'paypal':
                # Here would be PayPal integration code
                # For now, we'll simulate success
                order.payment_id = 'paypal_' + token
                order.mark_as_paid()
                
                return Response(
                    {'success': 'Payment processed successfully'},
                    status=status.HTTP_200_OK
                )
            
            else:
                return Response(
                    {'error': 'Invalid payment method'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class MessageViewSet(viewsets.ModelViewSet):
    """API endpoint for messages"""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            # Admin can see all messages they sent and all public messages
            return Message.objects.filter(
                sender=user
            ) | Message.objects.filter(
                message_type='admin_to_all'
            )
        else:
            # Regular users can see messages sent to them and public messages
            return Message.objects.filter(
                recipient=user, 
                message_type='admin_to_user'
            ) | Message.objects.filter(
                message_type='admin_to_all'
            )
    
    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
    
    @action(detail=False, methods=['post'])
    def send_public_message(self, request):
        """Send a message to all users (admin only)"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Only admin can send public messages'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        subject = request.data.get('subject')
        content = request.data.get('content')
        
        if not subject or not content:
            return Response(
                {'error': 'Subject and content are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        message = Message.objects.create(
            sender=request.user,
            recipient=None,
            subject=subject,
            content=content,
            message_type='admin_to_all'
        )
        
        serializer = MessageSerializer(message)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def send_user_message(self, request):
        """Send a message to a specific user (admin only)"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Only admin can send user messages'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        recipient_id = request.data.get('recipient_id')
        subject = request.data.get('subject')
        content = request.data.get('content')
        
        if not all([recipient_id, subject, content]):
            return Response(
                {'error': 'Recipient ID, subject, and content are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            recipient = User.objects.get(pk=recipient_id)
            
            message = Message.objects.create(
                sender=request.user,
                recipient=recipient,
                subject=subject,
                content=content,
                message_type='admin_to_user'
            )
            
            serializer = MessageSerializer(message)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {'error': 'Recipient not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a message as read"""
        message = self.get_object()
        
        # Only recipient can mark message as read
        if message.recipient != request.user and not request.user.is_staff:
            return Response(
                {'error': 'You cannot mark this message as read'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        message.is_read = True
        message.save()
        
        serializer = MessageSerializer(message)
        return Response(serializer.data) 