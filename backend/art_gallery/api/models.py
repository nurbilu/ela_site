from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid

class ArtPicture(models.Model):
    """Model for art pictures that can be sold on the website"""
    title = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='art_pictures/', null=True, blank=True)
    image_url = models.URLField(blank=True, null=True, help_text="URL to the image if no file is uploaded")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_available = models.BooleanField(default=True)
    
    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['-created_at']
        
    @property
    def get_image_url(self):
        """Get the image URL, whether from uploaded file or external URL"""
        if self.image and hasattr(self.image, 'url'):
            return self.image.url
        elif self.image_url:
            return self.image_url
        return None

class Cart(models.Model):
    """Model for shopping cart"""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Cart of {self.user.username}"
    
    @property
    def total_price(self):
        """Calculate total price of all items in cart"""
        return sum(item.subtotal for item in self.cartitem_set.all())

class CartItem(models.Model):
    """Model for items in shopping cart"""
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE)
    art_picture = models.ForeignKey(ArtPicture, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.quantity} x {self.art_picture.title}"
    
    @property
    def subtotal(self):
        """Calculate subtotal for this item"""
        return self.art_picture.price * self.quantity

class Address(models.Model):
    """Model for structured addresses"""
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zipcode = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default='United States')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.street}, {self.city}, {self.state} {self.zipcode}, {self.country}"
    
    @property
    def full_address(self):
        """Return the full address as a string"""
        return self.__str__()

class Order(models.Model):
    """Model for customer orders"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )
    PAYMENT_METHOD_CHOICES = (
        ('credit_card', 'Credit Card'),
        ('paypal', 'PayPal'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    order_number = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_id = models.CharField(max_length=100, blank=True, null=True)
    payment_details = models.JSONField(blank=True, null=True, help_text="Additional payment details (e.g. PayPal transaction data)")
    
    # Legacy address fields (for backwards compatibility with existing orders)
    shipping_address = models.TextField(blank=True, null=True)
    billing_address = models.TextField(blank=True, null=True)
    
    # New structured address fields
    shipping_address_obj = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, related_name='shipping_orders')
    billing_address_obj = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, related_name='billing_orders')
    
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Order {self.order_number}"
    
    def mark_as_paid(self):
        """Mark order as paid and record the timestamp"""
        self.status = 'paid'
        self.paid_at = timezone.now()
        self.save()

class OrderItem(models.Model):
    """Model for items in an order"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    art_picture = models.ForeignKey(ArtPicture, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Price at time of purchase
    quantity = models.PositiveIntegerField(default=1)
    
    def __str__(self):
        return f"{self.quantity} x {self.art_picture.title}"
    
    @property
    def subtotal(self):
        """Calculate subtotal for this item"""
        return self.price * self.quantity

class Message(models.Model):
    """Model for messages between admin and users"""
    TYPE_CHOICES = (
        ('admin_to_user', 'Admin to User'),
        ('admin_to_all', 'Admin to All Users'),
        ('user_to_admin', 'User to Admin'),
    )
    
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages', null=True, blank=True)
    subject = models.CharField(max_length=200)
    content = models.TextField()
    message_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        if self.message_type == 'admin_to_all':
            return f"Public message: {self.subject}"
        elif self.message_type == 'user_to_admin':
            return f"Message from {self.sender.username} to Admin: {self.subject}"
        return f"Message from {self.sender.username} to {self.recipient.username}: {self.subject}"
    
    class Meta:
        ordering = ['-created_at']


class OrderUserView(models.Model):
    """Database view that joins orders with user information"""
    id = models.BigAutoField(primary_key=True)
    order_number = models.UUIDField()
    status = models.CharField(max_length=20)
    payment_method = models.CharField(max_length=20)
    payment_id = models.CharField(max_length=100, blank=True, null=True)
    payment_details = models.JSONField(blank=True, null=True)
    shipping_address = models.TextField(blank=True, null=True)
    billing_address = models.TextField(blank=True, null=True)
    shipping_address_obj_id = models.IntegerField(null=True)
    billing_address_obj_id = models.IntegerField(null=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField()
    paid_at = models.DateTimeField(null=True, blank=True)
    user_id = models.IntegerField()
    username = models.CharField(max_length=150)
    email = models.EmailField(blank=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    display_name = models.CharField(max_length=301)  # first_name + ' ' + last_name or username
    
    class Meta:
        managed = False  # This tells Django not to manage this table (it's a view)
        db_table = 'api_order_user_view'
        ordering = ['username', '-created_at']
    
    def __str__(self):
        return f"Order {self.order_number} - {self.display_name}"