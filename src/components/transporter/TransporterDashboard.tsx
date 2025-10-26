'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Truck, 
  MapPin, 
  Clock,
  CheckCircle,
  Package,
  DollarSign,
  Star,
  Navigation,
  AlertCircle
} from 'lucide-react';
import { toast } from '../ui/use-toast';

interface AvailableOrder {
  _id: string;
  farmerId: {
    profile: {
      name: string;
      location: {
        address: string;
        coordinates: number[];
      };
    };
  };
  restaurantId: {
    profile: {
      name: string;
      location: {
        address: string;
        coordinates: number[];
      };
    };
  };
  crops: Array<{
    cropId: {
      name: string;
      images: string[];
    };
    quantity: number;
    unit: string;
  }>;
  totalAmount: number;
  deliveryFee: number;
  distance: number;
  estimatedDeliveryTime: string;
  createdAt: string;
}

interface MyOrder {
  _id: string;
  status: string;
  farmerId: {
    profile: {
      name: string;
      location: {
        address: string;
      };
    };
  };
  restaurantId: {
    profile: {
      name: string;
      location: {
        address: string;
      };
    };
  };
  crops: Array<{
    cropId: {
      name: string;
    };
    quantity: number;
    unit: string;
  }>;
  deliveryFee: number;
  distance: number;
  qualityVerification?: {
    score: number;
    notes: string;
  };
  createdAt: string;
}

interface EarningsData {
  totalEarnings: number;
  completedDeliveries: number;
  averageRating: number;
  thisMonth: number;
}

export default function TransporterDashboard() {
  const [availableOrders, setAvailableOrders] = useState<AvailableOrder[]>([]);
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');

  // User location (in production, get from GPS or user profile)
  const userLocation = { latitude: 17.3850, longitude: 78.4867 }; // Hyderabad

  useEffect(() => {
    fetchAvailableOrders();
    fetchMyOrders();
    fetchEarnings();
  }, []);

  const fetchAvailableOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/transporter/available-orders?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}&maxDistance=50`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setAvailableOrders(data.data.orders);
      }
    } catch (error) {
      console.error('Error fetching available orders:', error);
    }
  };

  const fetchMyOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/transporter/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMyOrders(data.data.orders);
      }
    } catch (error) {
      console.error('Error fetching my orders:', error);
    }
  };

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/transporter/earnings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setEarnings(data.data.earnings);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/transporter/accept-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Order Accepted!",
          description: "You have successfully accepted this delivery"
        });
        fetchAvailableOrders();
        fetchMyOrders();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to accept order",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      toast({
        title: "Error",
        description: "Failed to accept order",
        variant: "destructive"
      });
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      
      switch (newStatus) {
        case 'picked_up':
          endpoint = '/api/transporter/mark-picked-up';
          break;
        case 'in_transit':
          endpoint = '/api/transporter/mark-in-transit';
          break;
        case 'delivered':
          endpoint = '/api/transporter/mark-delivered';
          break;
        default:
          return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Status Updated!",
          description: `Order marked as ${newStatus.replace('_', ' ')}`
        });
        fetchMyOrders();
        fetchEarnings();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update status",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  };

  const verifyQuality = async (orderId: string, score: number, notes: string = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/transporter/verify-quality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId, qualityScore: score, notes })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Quality Verified!",
          description: `Quality score: ${score}/5`
        });
        fetchMyOrders();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to verify quality",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error verifying quality:', error);
      toast({
        title: "Error",
        description: "Failed to verify quality",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { color: 'bg-blue-500', text: 'Ready for Pickup', icon: Clock },
      picked_up: { color: 'bg-purple-500', text: 'Picked Up', icon: Package },
      in_transit: { color: 'bg-orange-500', text: 'In Transit', icon: Truck },
      delivered: { color: 'bg-green-500', text: 'Delivered', icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmed;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const getNextAction = (order: MyOrder) => {
    switch (order.status) {
      case 'confirmed':
        return (
          <Button
            onClick={() => updateOrderStatus(order._id, 'picked_up')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Mark as Picked Up
          </Button>
        );
      case 'picked_up':
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => verifyQuality(order._id, 4, 'Good quality crops')}
              variant="outline"
              size="sm"
            >
              Verify Quality
            </Button>
            <Button
              onClick={() => updateOrderStatus(order._id, 'in_transit')}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Start Transit
            </Button>
          </div>
        );
      case 'in_transit':
        return (
          <Button
            onClick={() => updateOrderStatus(order._id, 'delivered')}
            className="bg-green-600 hover:bg-green-700"
          >
            Mark as Delivered
          </Button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-orange-800">Transporter Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-600">Today's Earnings</div>
            <div className="text-lg font-bold">₹{earnings?.thisMonth || 0}</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {earnings && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{earnings.totalEarnings}</div>
              <p className="text-xs text-muted-foreground">
                All time earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Deliveries</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{earnings.completedDeliveries}</div>
              <p className="text-xs text-muted-foreground">
                Total deliveries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{earnings.averageRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Customer rating
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{earnings.thisMonth}</div>
              <p className="text-xs text-muted-foreground">
                Monthly earnings
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available">Available Orders ({availableOrders.length})</TabsTrigger>
          <TabsTrigger value="active">My Deliveries ({myOrders.filter(o => o.status !== 'delivered').length})</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {availableOrders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Truck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600">No available orders</h3>
                <p className="text-gray-500">Check back later for new delivery opportunities</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {availableOrders.map((order) => (
                <Card key={order._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Navigation className="w-5 h-5" />
                          {order.distance.toFixed(1)} km delivery
                        </CardTitle>
                        <CardDescription>
                          {order.farmerId.profile.name} → {order.restaurantId.profile.name}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">₹{order.deliveryFee}</div>
                        <div className="text-sm text-gray-600">Delivery fee</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4" />
                            Pickup Location
                          </h4>
                          <p className="text-sm text-gray-600">{order.farmerId.profile.location.address}</p>
                        </div>
                        <div>
                          <h4 className="font-medium flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4" />
                            Delivery Location
                          </h4>
                          <p className="text-sm text-gray-600">{order.restaurantId.profile.location.address}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Items to deliver:</h4>
                        <ul className="text-sm space-y-1">
                          {order.crops.map((crop, index) => (
                            <li key={index}>
                              {crop.quantity} {crop.unit} {crop.cropId.name}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t">
                        <div className="text-sm text-gray-600">
                          Order value: ₹{order.totalAmount}
                        </div>
                        <Button
                          onClick={() => acceptOrder(order._id)}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Accept Delivery
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="space-y-4">
            {myOrders.filter(order => order.status !== 'delivered').map((order) => (
              <Card key={order._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Delivery #{order._id.slice(-6)}</CardTitle>
                      <CardDescription>
                        {order.farmerId.profile.name} → {order.restaurantId.profile.name}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(order.status)}
                      <div className="text-lg font-bold text-green-600">₹{order.deliveryFee}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Items:</h4>
                      <ul className="text-sm space-y-1">
                        {order.crops.map((crop, index) => (
                          <li key={index}>
                            {crop.quantity} {crop.unit} {crop.cropId.name}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {order.qualityVerification && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-800">Quality Verified</span>
                        </div>
                        <div className="text-sm text-green-700">
                          Score: {order.qualityVerification.score}/5
                          {order.qualityVerification.notes && (
                            <span> - {order.qualityVerification.notes}</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Distance: {order.distance.toFixed(1)} km
                      </div>
                      {getNextAction(order)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="space-y-4">
            {myOrders.filter(order => order.status === 'delivered').map((order) => (
              <Card key={order._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Delivery #{order._id.slice(-6)}</CardTitle>
                      <CardDescription>
                        {order.farmerId.profile.name} → {order.restaurantId.profile.name}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                      <div className="text-lg font-bold text-green-600">₹{order.deliveryFee}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      Completed on {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      Distance: {order.distance.toFixed(1)} km
                    </div>
                    {order.qualityVerification && (
                      <div className="text-sm text-green-600">
                        Quality Score: {order.qualityVerification.score}/5
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
