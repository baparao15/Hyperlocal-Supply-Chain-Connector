'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { 
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  X,
  Eye,
  Camera,
  Star,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';

interface Delivery {
  _id: string;
  orderNumber: string;
  farmer: {
    name: string;
    phone: string;
    location: {
      address: string;
      city: string;
      state: string;
      coordinates: [number, number];
    };
  };
  restaurant: {
    name: string;
    phone: string;
    location: {
      address: string;
      city: string;
      state: string;
      coordinates: [number, number];
    };
  };
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    images: string[];
  }>;
  status: 'available' | 'accepted' | 'picked-up' | 'in-transit' | 'delivered' | 'cancelled';
  totalDistance: number;
  estimatedTime: number;
  deliveryFee: number;
  createdAt: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  qualityCheck?: {
    status: 'pending' | 'passed' | 'failed';
    notes?: string;
    images?: string[];
  };
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/transporter/deliveries', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setDeliveries(data.data.deliveries);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch deliveries',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const acceptDelivery = async (deliveryId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/transporter/deliveries/${deliveryId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Delivery accepted successfully'
        });
        fetchDeliveries();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to accept delivery',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept delivery',
        variant: 'destructive'
      });
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/transporter/deliveries/${deliveryId}`, {
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
          description: 'Delivery status updated successfully'
        });
        fetchDeliveries();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to update delivery status',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update delivery status',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-yellow-100 text-yellow-800';
      case 'picked-up': return 'bg-purple-100 text-purple-800';
      case 'in-transit': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <Package className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'picked-up': return <Truck className="w-4 h-4" />;
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
      <div>
        <h1 className="text-3xl font-bold">Deliveries</h1>
        <p className="text-muted-foreground">Manage your delivery assignments</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deliveries.filter(d => d.status === 'available').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deliveries.filter(d => ['accepted', 'picked-up', 'in-transit'].includes(d.status)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deliveries.filter(d => d.status === 'delivered').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{deliveries.filter(d => d.status === 'delivered').reduce((sum, d) => sum + d.deliveryFee, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deliveries List */}
      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {deliveries.filter(d => d.status === 'available').map((delivery) => (
            <Card key={delivery._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Delivery #{delivery.orderNumber}
                      <Badge className={getStatusColor(delivery.status)}>
                        {getStatusIcon(delivery.status)}
                        <span className="ml-1">{delivery.status}</span>
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{delivery.totalDistance}km</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{delivery.estimatedTime}min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>₹{delivery.deliveryFee}</span>
                        </div>
                      </div>
                    </CardDescription>
                  </div>
                  <Button onClick={() => acceptDelivery(delivery._id)}>
                    Accept Delivery
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Farmer Info */}
                  <div>
                    <h4 className="font-medium mb-2">Pickup from Farmer</h4>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <div>
                        <p className="font-medium">{delivery.farmer.name}</p>
                        <p className="text-sm text-muted-foreground">{delivery.farmer.phone}</p>
                        <p className="text-sm text-muted-foreground">{delivery.farmer.location.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Restaurant Info */}
                  <div>
                    <h4 className="font-medium mb-2">Deliver to Restaurant</h4>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <div>
                        <p className="font-medium">{delivery.restaurant.name}</p>
                        <p className="text-sm text-muted-foreground">{delivery.restaurant.phone}</p>
                        <p className="text-sm text-muted-foreground">{delivery.restaurant.location.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <h4 className="font-medium mb-2">Items to Deliver</h4>
                    <div className="space-y-2">
                      {delivery.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b">
                          <div className="flex items-center gap-2">
                            {item.images.length > 0 && (
                              <img
                                src={item.images[0]}
                                alt={item.name}
                                className="w-8 h-8 object-cover rounded"
                              />
                            )}
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.quantity} {item.unit}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4">
          {deliveries.filter(d => ['accepted', 'picked-up', 'in-transit'].includes(d.status)).map((delivery) => (
            <Card key={delivery._id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Delivery #{delivery.orderNumber}
                  <Badge className={getStatusColor(delivery.status)}>
                    {getStatusIcon(delivery.status)}
                    <span className="ml-1">{delivery.status}</span>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Pickup from</h4>
                      <p className="text-sm">{delivery.farmer.name}</p>
                      <p className="text-sm text-muted-foreground">{delivery.farmer.location.address}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Deliver to</h4>
                      <p className="text-sm">{delivery.restaurant.name}</p>
                      <p className="text-sm text-muted-foreground">{delivery.restaurant.location.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {delivery.status === 'accepted' && (
                      <Button onClick={() => updateDeliveryStatus(delivery._id, 'picked-up')}>
                        Mark as Picked Up
                      </Button>
                    )}
                    {delivery.status === 'picked-up' && (
                      <Button onClick={() => updateDeliveryStatus(delivery._id, 'in-transit')}>
                        Start Delivery
                      </Button>
                    )}
                    {delivery.status === 'in-transit' && (
                      <Button onClick={() => updateDeliveryStatus(delivery._id, 'delivered')}>
                        Mark as Delivered
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {deliveries.filter(d => d.status === 'delivered').map((delivery) => (
            <Card key={delivery._id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Delivery #{delivery.orderNumber}
                  <Badge className={getStatusColor(delivery.status)}>
                    {getStatusIcon(delivery.status)}
                    <span className="ml-1">{delivery.status}</span>
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Completed on {delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleDateString() : 'N/A'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span className="font-medium">₹{delivery.deliveryFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distance:</span>
                    <span className="font-medium">{delivery.totalDistance}km</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {deliveries.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No deliveries available</h3>
            <p className="text-muted-foreground text-center">
              New delivery assignments will appear here when they become available.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
