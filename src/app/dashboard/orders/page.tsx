'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { 
  ShoppingCart,
  Package,
  Truck,
  CheckCircle,
  Clock,
  X,
  Eye,
  MapPin,
  Calendar,
  User
} from 'lucide-react';

interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    cropId: string;
    name: string;
    quantity: number;
    unit: string;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'in-transit' | 'delivered' | 'cancelled';
  deliveryAddress: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  createdAt: string;
  deliveryDate?: string;
  transporter?: {
    name: string;
    phone: string;
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/farmer/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setOrders(data.data.orders);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch orders',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/farmer/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Order status updated successfully'
        });
        fetchOrders();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in-transit': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'in-transit': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage your crop orders</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status === 'in-transit').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status === 'delivered').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in-transit">In Transit</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {orders.map((order) => (
            <Card key={order._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Order #{order.orderNumber}
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{order.status}</span>
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{order.customer.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium mb-2">Order Items</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} {item.unit}
                            </p>
                          </div>
                          <p className="font-medium">₹{item.price * item.quantity}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center py-2 font-bold text-lg">
                      <span>Total Amount</span>
                      <span>₹{order.totalAmount}</span>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div>
                    <h4 className="font-medium mb-2">Delivery Address</h4>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5" />
                      <div>
                        <p>{order.deliveryAddress.address}</p>
                        <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</p>
                      </div>
                    </div>
                  </div>

                  {/* Transporter Info */}
                  {order.transporter && (
                    <div>
                      <h4 className="font-medium mb-2">Transporter</h4>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        <div>
                          <p className="font-medium">{order.transporter.name}</p>
                          <p className="text-sm text-muted-foreground">{order.transporter.phone}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    {order.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => updateOrderStatus(order._id, 'confirmed')}
                        >
                          Confirm Order
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => updateOrderStatus(order._id, 'cancelled')}
                        >
                          Cancel Order
                        </Button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateOrderStatus(order._id, 'in-transit')}
                      >
                        Mark as In Transit
                      </Button>
                    )}
                    {order.status === 'in-transit' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateOrderStatus(order._id, 'delivered')}
                      >
                        Mark as Delivered
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pending">
          {orders.filter(o => o.status === 'pending').map((order) => (
            <Card key={order._id}>
              <CardHeader>
                <CardTitle>Order #{order.orderNumber}</CardTitle>
                <CardDescription>{order.customer.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Total: ₹{order.totalAmount}</p>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={() => updateOrderStatus(order._id, 'confirmed')}>
                    Confirm
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => updateOrderStatus(order._id, 'cancelled')}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="in-transit">
          {orders.filter(o => o.status === 'in-transit').map((order) => (
            <Card key={order._id}>
              <CardHeader>
                <CardTitle>Order #{order.orderNumber}</CardTitle>
                <CardDescription>{order.customer.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Total: ₹{order.totalAmount}</p>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={() => updateOrderStatus(order._id, 'delivered')}>
                    Mark as Delivered
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="delivered">
          {orders.filter(o => o.status === 'delivered').map((order) => (
            <Card key={order._id}>
              <CardHeader>
                <CardTitle>Order #{order.orderNumber}</CardTitle>
                <CardDescription>{order.customer.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Total: ₹{order.totalAmount}</p>
                <p className="text-sm text-muted-foreground">
                  Delivered on {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'}
                </p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {orders.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground text-center">
              Your orders will appear here when customers place them.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
