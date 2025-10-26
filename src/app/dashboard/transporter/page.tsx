'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  Truck, 
  MapPin, 
  Clock, 
  DollarSign, 
  Package, 
  CheckCircle, 
  AlertTriangle,
  Star,
  Eye,
  Navigation,
  Calendar,
  TrendingUp,
  Users,
  FileText
} from 'lucide-react';

interface Order {
  _id: string;
  crops: Array<{
    cropId: {
      _id: string;
      name: string;
      images: string[];
    };
    quantity: number;
    price: number;
    unit: string;
  }>;
  totalAmount: number;
  deliveryFee: number;
  status: string;
  pickupLocation: {
    coordinates: number[];
    address: string;
  };
  deliveryLocation: {
    coordinates: number[];
    address: string;
  };
  distance: number;
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
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
  qualityVerification?: {
    score: number;
    notes: string;
    verifiedAt: string;
  };
  complaints: Array<{
    _id: string;
    raisedBy: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
}

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalEarnings: number;
  monthlyEarnings: number;
}

export default function TransporterDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalEarnings: 0,
    monthlyEarnings: 0
  });
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showQualityVerification, setShowQualityVerification] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchAvailableOrders(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Fallback to Hyderabad coordinates
          fetchAvailableOrders(17.3850, 78.4867);
        }
      );
    } else {
      fetchAvailableOrders(17.3850, 78.4867);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsRes, ordersRes] = await Promise.all([
        fetch('/api/transporter/dashboard-stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/transporter/orders', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();

      if (statsData.success) setStats(statsData.data);
      if (ordersData.success) setMyOrders(ordersData.data.orders);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableOrders = async (lat: number, lng: number) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lng.toString(),
        maxDistance: '50'
      });

      const response = await fetch(`/api/transporter/available-orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        setAvailableOrders(result.data.orders);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch available orders',
        variant: 'destructive'
      });
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/transporter/accept-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderId })
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Order Accepted',
          description: 'You have successfully accepted the delivery order'
        });
        fetchDashboardData();
        fetchAvailableOrders(17.3850, 78.4867); // Refresh available orders
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to accept order',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept order',
        variant: 'destructive'
      });
    }
  };

  const verifyQuality = async (orderId: string, qualityScore: number, notes: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/transporter/verify-quality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderId, qualityScore, notes })
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Quality Verified',
          description: 'Quality verification completed successfully'
        });
        setShowQualityVerification(false);
        fetchDashboardData();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to verify quality',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify quality',
        variant: 'destructive'
      });
    }
  };

  const markDelivered = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/transporter/mark-delivered', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderId })
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Order Delivered',
          description: 'Order has been marked as delivered successfully'
        });
        fetchDashboardData();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to mark as delivered',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark as delivered',
        variant: 'destructive'
      });
    }
  };

  const raiseComplaint = async (orderId: string, description: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/transporter/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderId, description })
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Complaint Raised',
          description: 'Your complaint has been submitted successfully'
        });
        setShowComplaint(false);
        fetchDashboardData();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to raise complaint',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to raise complaint',
        variant: 'destructive'
      });
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transporter Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your delivery jobs and earnings</p>
        </div>
        <Button onClick={getCurrentLocation} size="lg">
          <Navigation className="w-5 h-5 mr-2" />
          Refresh Jobs
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Truck className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completedOrders} completed
            </p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In progress
            </p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{stats.totalEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ₹{stats.monthlyEarnings.toLocaleString()} this month
            </p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Jobs</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{availableOrders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Near your location
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">Available Jobs</TabsTrigger>
          <TabsTrigger value="my-orders">My Orders</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableOrders.map((order) => (
              <Card key={order._id} className="overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:border-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-xl">
                    <span>Order #{order._id.slice(-6)}</span>
                    <Badge variant="secondary" className="font-semibold">Available</Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    {order.crops.length} items • {order.distance.toFixed(1)} km
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">From:</span>
                      <span className="font-semibold">{order.farmerId.profile.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">To:</span>
                      <span className="font-semibold">{order.restaurantId.profile.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Delivery Fee:
                      </span>
                      <span className="font-bold text-lg text-green-600">₹{order.deliveryFee}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Est. Time:
                      </span>
                      <span className="font-semibold">
                        {new Date(order.estimatedDeliveryTime).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Button 
                      size="lg" 
                      className="flex-1 font-semibold"
                      onClick={() => acceptOrder(order._id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-orders" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myOrders.map((order) => (
              <Card key={order._id} className="overflow-hidden border-2 hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-xl">
                    <span>Order #{order._id.slice(-6)}</span>
                    <Badge variant={
                      order.status === 'delivered' ? 'default' : 
                      order.status === 'picked_up' ? 'secondary' : 'outline'
                    } className="font-semibold">
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    {order.crops.length} items • {order.distance.toFixed(1)} km
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">From:</span>
                      <span className="font-semibold">{order.farmerId.profile.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">To:</span>
                      <span className="font-semibold">{order.restaurantId.profile.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Delivery Fee:
                      </span>
                      <span className="font-bold text-lg text-green-600">₹{order.deliveryFee}</span>
                    </div>
                    {order.qualityVerification && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Quality Score:</span>
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="font-bold">{order.qualityVerification.score}/5</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    {order.status === 'picked_up' && (
                      <Button 
                        size="lg" 
                        className="flex-1 font-semibold"
                        onClick={() => markDelivered(order._id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Delivered
                      </Button>
                    )}
                    {order.status === 'confirmed' && (
                      <Button 
                        size="lg" 
                        className="flex-1 font-semibold"
                        onClick={() => setShowQualityVerification(true)}
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Verify Quality
                      </Button>
                    )}
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="earnings">
          <Card className="border-2">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl">Earnings Overview</CardTitle>
              <CardDescription className="text-base">Your delivery earnings and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3 p-6 border-2 rounded-xl bg-gradient-to-br from-green-50 to-blue-50">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Total Earnings
                  </h3>
                  <p className="text-4xl font-bold text-green-600">₹{stats.totalEarnings.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    From {stats.completedOrders} completed deliveries
                  </p>
                </div>
                <div className="space-y-3 p-6 border-2 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    This Month
                  </h3>
                  <p className="text-4xl font-bold text-purple-600">₹{stats.monthlyEarnings.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Current month earnings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl font-bold">Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border-2 rounded-xl bg-gradient-to-br from-green-50 to-blue-50">
                  <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    Pickup Location
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.pickupLocation.address}
                  </p>
                </div>
                <div className="p-4 border-2 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
                  <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    Delivery Location
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.deliveryLocation.address}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-3">Items</h4>
                <div className="space-y-3">
                  {selectedOrder.crops.map((crop, index) => (
                    <div key={index} className="flex justify-between items-center p-4 border-2 rounded-xl hover:shadow-md transition-shadow">
                      <div>
                        <p className="font-bold text-base">{crop.cropId.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {crop.quantity} {crop.unit} • ₹{crop.price}/{crop.unit}
                        </p>
                      </div>
                      <p className="font-bold text-lg">₹{crop.price * crop.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t-2 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-xl font-bold">₹{selectedOrder.totalAmount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-green-600">Delivery Fee:</span>
                  <span className="text-xl font-bold text-green-600">₹{selectedOrder.deliveryFee}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quality Verification Dialog */}
      <Dialog open={showQualityVerification} onOpenChange={setShowQualityVerification}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quality Verification</DialogTitle>
          </DialogHeader>
          <QualityVerificationForm 
            onSubmit={(score, notes) => {
              if (selectedOrder) {
                verifyQuality(selectedOrder._id, score, notes);
              }
            }} 
          />
        </DialogContent>
      </Dialog>

      {/* Complaint Dialog */}
      <Dialog open={showComplaint} onOpenChange={setShowComplaint}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise Complaint</DialogTitle>
          </DialogHeader>
          <ComplaintForm 
            onSubmit={(description) => {
              if (selectedOrder) {
                raiseComplaint(selectedOrder._id, description);
              }
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Quality Verification Form Component
function QualityVerificationForm({ onSubmit }: { onSubmit: (score: number, notes: string) => void }) {
  const [score, setScore] = useState(5);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(score, notes);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="score">Quality Score (1-5)</Label>
        <Select value={score.toString()} onValueChange={(value) => setScore(parseInt(value))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 - Poor</SelectItem>
            <SelectItem value="2">2 - Below Average</SelectItem>
            <SelectItem value="3">3 - Average</SelectItem>
            <SelectItem value="4">4 - Good</SelectItem>
            <SelectItem value="5">5 - Excellent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional comments about the quality..."
        />
      </div>
      
      <Button type="submit" className="w-full">
        Submit Verification
      </Button>
    </form>
  );
}

// Complaint Form Component
function ComplaintForm({ onSubmit }: { onSubmit: (description: string) => void }) {
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(description);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="description">Complaint Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue with the order..."
          required
        />
      </div>
      
      <Button type="submit" className="w-full">
        Submit Complaint
      </Button>
    </form>
  );
}
