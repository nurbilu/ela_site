import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from art_gallery.api.models import ArtPicture
from django.conf import settings


class Command(BaseCommand):
    help = 'Creates sample art pictures for demonstration'

    def handle(self, *args, **options):
        # Delete existing art pictures if any
        ArtPicture.objects.all().delete()
        
        # Create art pictures using actual image files
        art_pictures = [
            {
                'title': 'Test Birdy',
                'description': 'A test art picture featuring a small yellow and gray bird. This is a free test item with zero price.',
                'price': '0.00',
                'image': 'bird-test-prod.jpg',
                'is_available': True
            },
            {
                'title': 'A Lady and an Angel',
                'description': 'A beautiful painting depicting a serene lady and an ethereal angel figure. The painting features vibrant yellow and orange backgrounds with delicate birds and flowers.',
                'price': '499.99',
                'image': 'a lady and an angel.jpg',
                'is_available': True
            },
            {
                'title': 'Buddha',
                'description': 'A peaceful Buddha figure painted with golden and blue tones. This spiritual artwork captures the tranquility and wisdom of Buddhist philosophy.',
                'price': '349.99',
                'image': 'Buddha.jpg',
                'is_available': True
            },
            {
                'title': 'The Druid',
                'description': 'A mystical druid figure with blue skin and floral adornments. This painting depicts the connection between humanity and nature in a circular composition.',
                'price': '399.99',
                'image': 'the druid.jpg',
                'is_available': True
            },
            {
                'title': 'The Hummingbird in the Garden',
                'description': 'A vibrant explosion of colorful flowers and hummingbirds in flight. This joyful painting celebrates the beauty of nature with its detailed flora and fauna.',
                'price': '459.99',
                'image': 'the hummingbird in the garden.jpg',
                'is_available': True
            }
        ]
        
        created_count = 0
        
        for art_data in art_pictures:
            art_picture = ArtPicture(
                title=art_data['title'],
                description=art_data['description'],
                price=art_data['price'],
                image=art_data['image'],
                is_available=art_data['is_available']
            )
            art_picture.save()
            created_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Created {created_count} sample art pictures')) 