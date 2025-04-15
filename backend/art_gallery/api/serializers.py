from rest_framework import serializers
from django.contrib.auth.models import User
from .models import ArtPicture, Cart, CartItem, Order, OrderItem, Message, Address

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password']
        
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password']
        )
        return user

class ArtPictureSerializer(serializers.ModelSerializer):
    """Serializer for ArtPicture model"""
    image_full_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ArtPicture
        fields = ['id', 'title', 'description', 'price', 'image', 'image_url', 'image_full_url', 'created_at', 'updated_at', 'is_available']
    
    def get_image_full_url(self, obj):
        """Get the full image URL, either from the uploaded file or external URL"""
        request = self.context.get('request')
        
        if obj.image and hasattr(obj.image, 'url'):
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        elif obj.image_url:
            return obj.image_url
        
        # Return a placeholder image URL if no image is available
        return "https://via.placeholder.com/800x600?text=No+Image+Available"

class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for CartItem model"""
    art_picture = ArtPictureSerializer(read_only=True)
    art_picture_id = serializers.IntegerField(write_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = CartItem
        fields = ['id', 'art_picture', 'art_picture_id', 'quantity', 'added_at', 'subtotal']

class CartSerializer(serializers.ModelSerializer):
    """Serializer for Cart model"""
    items = CartItemSerializer(source='cartitem_set', many=True, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Cart
        fields = ['id', 'user', 'created_at', 'updated_at', 'items', 'total_price']

class AddressSerializer(serializers.ModelSerializer):
    """Serializer for Address model"""
    class Meta:
        model = Address
        fields = ['id', 'street', 'city', 'state', 'zipcode', 'country', 'created_at']
        read_only_fields = ['created_at']

class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for OrderItem model"""
    art_picture = ArtPictureSerializer(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'art_picture', 'price', 'quantity', 'subtotal']

class OrderSerializer(serializers.ModelSerializer):
    """Serializer for Order model"""
    items = OrderItemSerializer(source='orderitem_set', many=True, read_only=True)
    shipping_address_structured = AddressSerializer(source='shipping_address_obj', read_only=True)
    billing_address_structured = AddressSerializer(source='billing_address_obj', read_only=True)
    
    # Fields for creating an order
    shipping_address_data = serializers.JSONField(write_only=True, required=False)
    billing_address_data = serializers.JSONField(write_only=True, required=False)
    
    class Meta:
        model = Order
        fields = [
            'id', 'user', 'order_number', 'status', 'payment_method', 'payment_id',
            'shipping_address', 'billing_address', 
            'shipping_address_structured', 'billing_address_structured',
            'shipping_address_data', 'billing_address_data',
            'total_price', 'created_at', 'paid_at', 'items'
        ]
        read_only_fields = ['order_number', 'created_at', 'paid_at', 
                           'shipping_address_structured', 'billing_address_structured']

class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model"""
    sender_username = serializers.ReadOnlyField(source='sender.username')
    recipient_username = serializers.ReadOnlyField(source='recipient.username')
    
    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'sender_username', 'recipient', 'recipient_username', 
            'subject', 'content', 'message_type', 'is_read', 'created_at'
        ]
        read_only_fields = ['sender', 'created_at'] 