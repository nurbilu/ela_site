# Art Gallery Website

A full-stack web application for selling art pictures online, built with Django REST Framework and React with Redux.

## Features

- **User Authentication**: Register, login, and manage user accounts
- **Art Gallery**: Browse and search for art pictures
- **Shopping Cart**: Add items to cart, update quantities, and remove items
- **Checkout Process**: Secure payment processing with Stripe
- **Order Management**: View and track orders
- **Messaging System**: Admin can send public or private messages to users
- **Admin Dashboard**: Manage art pictures, orders, and messages

## Tech Stack

### Backend

- Django 4.2
- Django REST Framework
- MySQL Database
- JWT Authentication
- Stripe for payment processing

### Frontend

- React 18
- Redux Toolkit for state management
- React Router for navigation
- React Bootstrap for UI components
- Stripe.js for payment integration

## Installation

### Prerequisites

- Python 3.8+
- Node.js 16+
- MySQL Server

### Backend Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/art-gallery.git
   cd art-gallery
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```
   # On Windows:
   copy .env.example .env
   # On Unix/Linux:
   # cp .env.example .env
   ```
   Then edit the `.env` file with your actual configuration:
   - Set your MySQL database credentials
   - Add your Stripe API secret key
   - Update any other settings as needed

5. Set up the MySQL database:
   - Create a new database named `art_gallery_db` (or as specified in your .env file)

6. Generate and apply migrations:
   ```
   py manage.py makemigrations
   py manage.py migrate
   ```

7. Create a superuser:
   ```
   py manage.py createsuperuser
   ```

8. Run the development server:
   ```
   py manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   # On Windows:
   copy .env.example .env
   # On Unix/Linux:
   # cp .env.example .env
   ```
   Then edit the `.env` file with your actual configuration:
   - Add your Stripe publishable key
   - Update any other settings as needed

4. Start the development server:
   ```
   npm start
   ```

5. The application will be available at `http://localhost:3000`

## Usage

### Admin User

1. Log in with the superuser credentials
2. Access the admin dashboard at `/admin/dashboard`
3. Manage art pictures, orders, and messages

### Regular User

1. Register a new account or log in
2. Browse the gallery and add art pictures to cart
3. Proceed to checkout and complete payment
4. View orders and receive messages from admin

## Deployment

For production deployment:

1. Set `DEBUG = False` in the .env file
2. Configure proper database credentials in the .env file
3. Use proper Stripe API keys in the .env files
4. Set up proper CORS settings
5. Build the React frontend with `npm run build`
6. Serve the static files using a web server like Nginx

## Security Notes

- Never commit your .env files to version control
- Use proper environment variables for all sensitive information
- Rotate your API keys and secrets regularly
- Implement proper error handling and validation

## License

This project is licensed under the MIT License - see the LICENSE file for details. 