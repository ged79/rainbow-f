export interface Order {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    recipient_name?: string;
    recipient_phone?: string;
    delivery_address?: string;
    delivery_date?: string;
    product_name?: string;
    product_id?: string;
    quantity: number;
    original_price: number;
    discount_amount?: number;
    total_amount: number;
    status: string;
    store_id?: string;
    store_name?: string;
    created_at: string;
}
export interface Store {
    id: string;
    name: string;
    owner_name: string;
    phone: string;
    address?: string;
    business_number?: string;
    created_at: string;
}
export interface Product {
    id: string;
    display_name: string;
    category_1: string;
    category_2?: string;
    customer_price: number;
    florist_price: number;
    image_url?: string;
    is_active: boolean;
}
