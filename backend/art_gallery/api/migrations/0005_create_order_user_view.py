# Generated migration for creating order_user_view

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_order_payment_details'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE VIEW api_order_user_view AS
            SELECT 
                o.id,
                o.order_number,
                o.status,
                o.payment_method,
                o.payment_id,
                o.payment_details,
                o.shipping_address,
                o.billing_address,
                o.shipping_address_obj_id,
                o.billing_address_obj_id,
                o.total_price,
                o.created_at,
                o.paid_at,
                o.user_id,
                u.username,
                u.email,
                u.first_name,
                u.last_name,
                COALESCE(u.first_name || ' ' || u.last_name, u.username) as display_name
            FROM api_order o
            INNER JOIN auth_user u ON o.user_id = u.id
            ORDER BY u.username, o.created_at DESC;
            """,
            reverse_sql="DROP VIEW IF EXISTS api_order_user_view;"
        ),
    ] 