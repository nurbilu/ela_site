from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db import transaction

import stripe
from django.conf import settings

from .models import ArtPicture, Cart, CartItem, Order, OrderItem, Message, Address, OrderUserView
from .serializers import (
    UserSerializer, ArtPictureSerializer, CartSerializer, CartItemSerializer,
    OrderSerializer, OrderItemSerializer, MessageSerializer, OrderUserViewSerializer
)

# Configure Stripe API key
stripe.api_key = settings.STRIPE_API_KEY

class IsAdminOrSuperuser(permissions.BasePermission):
    """
    Custom permission to only allow admins/superusers access.
    """
    def has_permission(self, request, view):
        return request.user and (request.user.is_staff or request.user.is_superuser)

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins/superusers to edit objects,
    but allow anyone to view them.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and (request.user.is_staff or request.user.is_superuser)

class UserViewSet(viewsets.ModelViewSet):
    """API endpoint for users"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action == 'create' or self.action == 'me':
            return [AllowAny()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [IsAdminUser()]
    
    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.is_superuser:
            return User.objects.all()
        if self.request.user.is_authenticated:
            return User.objects.filter(id=self.request.user.id)
        return User.objects.none()
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get the current user's profile"""
        if not request.user.is_authenticated:
            return Response({"detail": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
        
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class ArtPictureViewSet(viewsets.ModelViewSet):
    """API endpoint for art pictures"""
    queryset = ArtPicture.objects.all()
    serializer_class = ArtPictureSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_permissions(self):
        """Allow unauthenticated access to list and retrieve"""
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminOrReadOnly()]
    
    def get_queryset(self):
        queryset = ArtPicture.objects.all()
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            queryset = queryset.filter(is_available=True)
        return queryset
    
    def get_serializer_context(self):
        """Add request to serializer context for proper image URL generation"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

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
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['destroy', 'update', 'partial_update']:
            # Only admins/superusers can delete or update orders
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Admins/superusers can see all orders, users can only see their own"""
        if self.request.user.is_staff or self.request.user.is_superuser:
            return Order.objects.all().order_by('-created_at')
        return Order.objects.filter(user=self.request.user).order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def checkout(self, request):
        """Handle checkout process - create order and prepare for payment"""
        data = request.data
        user = request.user
        
        # Create addresses first
        shipping_address_data = data.get('shipping_address_data')
        billing_address_data = data.get('billing_address_data')
        same_as_shipping = data.get('same_as_shipping', False)
        
        if same_as_shipping:
            billing_address_data = shipping_address_data
        
        shipping_address = None
        billing_address = None
        
        try:
            # Create shipping address
            shipping_address = Address.objects.create(
                street=shipping_address_data.get('street', ''),
                city=shipping_address_data.get('city', ''),
                state=shipping_address_data.get('state', ''),
                zipcode=shipping_address_data.get('zipcode', ''),
                country=shipping_address_data.get('country', 'United States')
            )
            
            # For backwards compatibility, also create a flat address string
            shipping_address_str = f"{shipping_address_data.get('street', '')}, {shipping_address_data.get('city', '')}, {shipping_address_data.get('state', '')} {shipping_address_data.get('zipcode', '')}, {shipping_address_data.get('country', 'United States')}"
            
            # Create billing address if not same as shipping
            if not same_as_shipping:
                billing_address = Address.objects.create(
                    street=billing_address_data.get('street', ''),
                    city=billing_address_data.get('city', ''),
                    state=billing_address_data.get('state', ''),
                    zipcode=billing_address_data.get('zipcode', ''),
                    country=billing_address_data.get('country', 'United States')
                )
                
                # For backwards compatibility, also create a flat address string
                billing_address_str = f"{billing_address_data.get('street', '')}, {billing_address_data.get('city', '')}, {billing_address_data.get('state', '')} {billing_address_data.get('zipcode', '')}, {billing_address_data.get('country', 'United States')}"
            else:
                billing_address = shipping_address
                billing_address_str = shipping_address_str
                
            # Get or create user's cart
            cart, created = Cart.objects.get_or_create(user=user)
            
            # Create order
            order = Order.objects.create(
                user=user,
                shipping_address=shipping_address_str,
                billing_address=billing_address_str,
                shipping_address_obj=shipping_address,
                billing_address_obj=billing_address,
                payment_method=data.get('payment_method', 'credit_card'),
                status='pending',
                total_price=cart.total_price
            )
            
            # Add cart items to the order
            for cart_item in cart.cartitem_set.all():
                OrderItem.objects.create(
                    order=order,
                    art_picture=cart_item.art_picture,
                    price=cart_item.art_picture.price,
                    quantity=cart_item.quantity
                )
            
            # Clear the cart after creating order
            cart.cartitem_set.all().delete()
            
            serializer = self.get_serializer(order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # Clean up any created objects if the order creation fails
            if shipping_address:
                shipping_address.delete()
            if billing_address and billing_address != shipping_address:
                billing_address.delete()
            
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def create(self, request, *args, **kwargs):
        data = request.data
        user = request.user
        
        # For admin/superuser restoration, use the specified user ID
        if (request.user.is_staff or request.user.is_superuser) and 'user' in data:
            try:
                user = User.objects.get(id=data['user'])
            except User.DoesNotExist:
                return Response({'error': 'Specified user not found'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create addresses first
        shipping_address_data = data.get('shipping_address_data')
        billing_address_data = data.get('billing_address_data')
        
        shipping_address = None
        billing_address = None
        
        if shipping_address_data and isinstance(shipping_address_data, dict):
            shipping_address = Address.objects.create(
                street=shipping_address_data.get('street', ''),
                city=shipping_address_data.get('city', ''),
                state=shipping_address_data.get('state', ''),
                zipcode=shipping_address_data.get('zipcode', ''),
                country=shipping_address_data.get('country', 'United States'),
                user=user
            )
            
            # For backwards compatibility, also create a flat address string
            shipping_address_str = f"{shipping_address_data.get('street', '')}, {shipping_address_data.get('city', '')}, {shipping_address_data.get('state', '')} {shipping_address_data.get('zipcode', '')}, {shipping_address_data.get('country', 'United States')}"
        else:
            # Legacy format - just a string
            shipping_address_str = data.get('shipping_address', '')
        
        if billing_address_data and isinstance(billing_address_data, dict):
            billing_address = Address.objects.create(
                street=billing_address_data.get('street', ''),
                city=billing_address_data.get('city', ''),
                state=billing_address_data.get('state', ''),
                zipcode=billing_address_data.get('zipcode', ''),
                country=billing_address_data.get('country', 'United States'),
                user=user
            )
            
            # For backwards compatibility, also create a flat address string
            billing_address_str = f"{billing_address_data.get('street', '')}, {billing_address_data.get('city', '')}, {billing_address_data.get('state', '')} {billing_address_data.get('zipcode', '')}, {billing_address_data.get('country', 'United States')}"
        else:
            # Legacy format - just a string
            billing_address_str = data.get('billing_address', '')
        
        # Create order with addresses
        try:
            order = Order.objects.create(
                user=user,
                shipping_address=shipping_address_str,
                billing_address=billing_address_str,
                shipping_address_obj=shipping_address,
                billing_address_obj=billing_address,
                payment_method=data.get('payment_method', 'credit_card'),
                payment_id=data.get('payment_id', ''),
                total_price=data.get('total_price', 0),
                status=data.get('status', 'pending')
            )
            
            # Add items to the order
            for item_data in data.get('items', []):
                art_picture_id = item_data.get('art_picture_id')
                quantity = item_data.get('quantity', 1)
                price = item_data.get('price')
                
                if art_picture_id:
                    try:
                        art_picture = ArtPicture.objects.get(id=art_picture_id)
                        OrderItem.objects.create(
                            order=order,
                            art_picture=art_picture,
                            quantity=quantity,
                            price=price if price is not None else art_picture.price
                        )
                    except ArtPicture.DoesNotExist:
                        pass
            
            serializer = self.get_serializer(order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            # If any addresses were created, delete them since order creation failed
            if shipping_address:
                shipping_address.delete()
            if billing_address:
                billing_address.delete()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
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
                # Get PayPal details from request data
                paypal_details = request.data.get('paypalDetails', {})
                
                # Check if we're in simulation mode
                simulation_mode = getattr(settings, 'PAYPAL_SIMULATION_MODE', True)
                
                if simulation_mode:
                    # In simulation mode, we accept all PayPal payments without verification
                    print(f"PayPal SIMULATION MODE: Accepting payment without verification")
                    print(f"Payment details: {paypal_details}")
                    
                    # Record payment details
                    order.payment_id = f"paypal_simulated_{token}"
                    order.payment_details = {
                        **paypal_details,
                        'simulated': True,
                        'verification_skipped': True
                    }
                    order.mark_as_paid()
                    
                    return Response(
                        {'success': 'PayPal payment simulated successfully'},
                        status=status.HTTP_200_OK
                    )
                
                # Real PayPal API integration for non-simulation mode
                try:
                    import requests
                    
                    # Get PayPal credentials from settings
                    paypal_client_id = getattr(settings, 'PAYPAL_CLIENT_ID', 'sb')
                    paypal_client_secret = getattr(settings, 'PAYPAL_CLIENT_SECRET', '')
                    paypal_sandbox = getattr(settings, 'PAYPAL_SANDBOX', True)
                    paypal_base_url = 'https://api-m.sandbox.paypal.com' if paypal_sandbox else 'https://api-m.paypal.com'
                    
                    # If client secret is provided, verify the payment with PayPal
                    if paypal_client_secret:
                        # Get access token from PayPal
                        auth_response = requests.post(
                            f'{paypal_base_url}/v1/oauth2/token',
                            auth=(paypal_client_id, paypal_client_secret),
                            data={'grant_type': 'client_credentials'},
                            headers={
                                'Accept': 'application/json',
                                'Accept-Language': 'en_US'
                            }
                        )
                        
                        if auth_response.status_code != 200:
                            print(f"PayPal auth error: {auth_response.text}")
                            raise Exception("Failed to authenticate with PayPal")
                            
                        access_token = auth_response.json().get('access_token')
                        
                        # Verify the order with PayPal
                        order_id = paypal_details.get('orderID')
                        if not order_id:
                            raise Exception("PayPal order ID not provided")
                            
                        order_response = requests.get(
                            f'{paypal_base_url}/v2/checkout/orders/{order_id}',
                            headers={
                                'Content-Type': 'application/json',
                                'Authorization': f'Bearer {access_token}'
                            }
                        )
                        
                        if order_response.status_code != 200:
                            print(f"PayPal order verification error: {order_response.text}")
                            raise Exception("Failed to verify PayPal order")
                            
                        payment_data = order_response.json()
                        print(f"Received PayPal verification: {payment_data}")
                        
                        # Check if payment was successful - for sandbox we'll accept APPROVED too
                        if payment_data.get('status') not in ['COMPLETED', 'APPROVED']:
                            return Response(
                                {'error': f"PayPal payment verification failed: {payment_data.get('status')}"},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                    else:
                        # For sandbox testing without client secret, we'll accept all payments
                        print(f"Sandbox mode without client secret: Accepting PayPal payment without verification")
                    
                    # Record payment details
                    order.payment_id = f"paypal_{token}"
                    order.payment_details = paypal_details
                    order.mark_as_paid()
                    
                    return Response(
                        {'success': 'PayPal payment processed successfully'},
                        status=status.HTTP_200_OK
                    )
                    
                except Exception as e:
                    print(f"PayPal payment error: {str(e)}")
                    return Response(
                        {'error': f"PayPal payment error: {str(e)}"},
                        status=status.HTTP_400_BAD_REQUEST
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
    
    @action(detail=False, methods=['post'])
    def restore_order(self, request):
        """Restore a deleted order (admin/superuser only)"""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'Only administrators/superusers can restore orders'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Use the same create logic but with explicit restoration context
        return self.create(request)

class MessageViewSet(viewsets.ModelViewSet):
    """API endpoint for messages"""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Set custom permissions for different actions"""
        if self.action in ['create', 'send_public_message']:
            return [IsAdminUser()]  # Admins/superusers only
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            # Admin/superuser can see all messages they sent, all public messages, and all user-to-admin messages
            return Message.objects.filter(
                sender=user
            ) | Message.objects.filter(
                message_type='admin_to_all'
            ) | Message.objects.filter(
                message_type='user_to_admin'
            )
        else:
            # Regular users can see messages sent to them, public messages, and their own messages to admin
            return Message.objects.filter(
                recipient=user, 
                message_type='admin_to_user'
            ) | Message.objects.filter(
                message_type='admin_to_all'
            ) | Message.objects.filter(
                sender=user,
                message_type='user_to_admin'
            )
    
    def perform_create(self, serializer):
        """Ensure only admins/superusers can create messages directly"""
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            raise PermissionDenied("Only administrators/superusers can create messages")
        serializer.save(sender=self.request.user)
    
    @action(detail=False, methods=['post'])
    def send_public_message(self, request):
        """Send a message to all users (admin/superuser only)"""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'Only admin/superuser can send public messages'},
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
    def contact_admin(self, request):
        """Allow users to contact admin (renamed from send_user_message)"""
        content = request.data.get('content')
        
        if not content:
            return Response(
                {'error': 'Content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find an admin to send the message to
        try:
            admin = User.objects.filter(is_staff=True).first()
            if not admin:
                return Response(
                    {'error': 'No admin found to send message to'},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            message = Message.objects.create(
                sender=request.user,
                recipient=admin,
                subject=f"Message from {request.user.username}",
                content=content,
                message_type='user_to_admin'
            )
            
            serializer = MessageSerializer(message)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a message as read"""
        message = self.get_object()
        
        # Only recipient can mark message as read
        if message.recipient != request.user and not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'You cannot mark this message as read'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        message.is_read = True
        message.save()
        
        serializer = MessageSerializer(message)
        return Response(serializer.data)


class OrderUserViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for order user view - read-only access to orders with user info"""
    queryset = OrderUserView.objects.all()
    serializer_class = OrderUserViewSerializer
    permission_classes = [IsAdminOrSuperuser]  # Only admins/superusers can access this view
    
    def get_queryset(self):
        """Return orders grouped by username"""
        return OrderUserView.objects.all().order_by('username', '-created_at')
    
    @action(detail=False, methods=['get'])
    def grouped_by_user(self, request):
        """Get orders grouped by username"""
        orders = self.get_queryset()
        
        # Group orders by username
        grouped_orders = {}
        for order in orders:
            username = order.username
            if username not in grouped_orders:
                grouped_orders[username] = {
                    'user_info': {
                        'user_id': order.user_id,
                        'username': order.username,
                        'email': order.email,
                        'first_name': order.first_name,
                        'last_name': order.last_name,
                        'display_name': order.display_name
                    },
                    'orders': []
                }
            
            # Add order to user's group
            order_data = OrderUserViewSerializer(order).data
            grouped_orders[username]['orders'].append(order_data)
        
        # Convert to list format for easier frontend consumption
        result = []
        for username, data in grouped_orders.items():
            result.append({
                'username': username,
                'user_info': data['user_info'],
                'orders': data['orders'],
                'order_count': len(data['orders'])
            })
        
        return Response(result)