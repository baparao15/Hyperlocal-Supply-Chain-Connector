'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mic, 
  Plus, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from '../ui/use-toast';

interface DashboardStats {
  crops: {
    total: number;
    available: number;
    sold: number;
  };
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    delivered: number;
  };
  earnings: {
    total: number;
    currency: string;
  };
  recentOrders: any[];
}

interface Crop {
  _id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  quantity: number;
  availableQuantity: number;
  status: string;
  organic: boolean;
  quality: string;
  images: string[];
  createdAt: string;
}

interface Order {
  _id: string;
  status: string;
  totalAmount: number;
  deliveryFee: number;
  restaurantId: {
    profile: {
      name: string;
    };
  };
  crops: Array<{
    cropId: {
      name: string;
    };
    quantity: number;
    unit: string;
  }>;
  createdAt: string;
}

export default function FarmerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('');

  useEffect(() => {
    fetchDashboardData();
    fetchCrops();
    fetchOrders();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/farmer/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchCrops = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/farmer/crops', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCrops(data.data.crops);
      }
    } catch (error) {
      console.error('Error fetching crops:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/farmer/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceRecording = async () => {
    if (!isRecording) {
      // Start recording
      setIsRecording(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result?.toString().split(',')[1];
            if (base64Audio) {
              await processVoiceInput(base64Audio);
            }
          };
        };

        mediaRecorder.start();

        // Stop recording after 10 seconds
        setTimeout(() => {
          mediaRecorder.stop();
          stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
        }, 10000);

      } catch (error) {
        console.error('Error accessing microphone:', error);
        setIsRecording(false);
        toast({
          title: "Error",
          description: "Could not access microphone. Please check permissions.",
          variant: "destructive"
        });
      }
    }
  };

  const processVoiceInput = async (audioData: string) => {
    try {
      const token = localStorage.getItem('token');
      
      // For now, simulate voice to text conversion
      // In production, you would use Google Speech-to-Text API
      const simulatedText = "I have 10 kg tomatoes, 5 kg onions, and 20 kg rice available";
      setVoiceText(simulatedText);
      
      // Process the transcription to create crops
      await processVoiceCropListing(simulatedText);
    } catch (error) {
      console.error('Error processing voice input:', error);
      toast({
        title: "Error",
        description: "Failed to process voice input",
        variant: "destructive"
      });
    }
  };

  const processVoiceCropListing = async (transcription: string) => {
    try {
      const token = localStorage.getItem('token');
      
      // Get user location (simplified - in production, get from user profile)
      const location = {
        coordinates: [78.4867, 17.3850], // Hyderabad coordinates as example
        address: "Farm Location, Hyderabad"
      };

      const response = await fetch('http://localhost:5000/api/farmer/crops/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          voiceText: transcription,
          language: 'en',
          location
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success!",
          description: `Added ${data.data.crops.length} crops via voice input`,
        });
        fetchCrops(); // Refresh crops list
        fetchDashboardData(); // Refresh stats
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to process voice crop listing",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing voice crop listing:', error);
      toast({
        title: "Error",
        description: "Failed to process voice crop listing",
        variant: "destructive"
      });
    }
  };

  const confirmOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/farmer/orders/${orderId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success!",
          description: "Order confirmed successfully",
        });
        fetchOrders();
        fetchDashboardData();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to confirm order",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      toast({
        title: "Error",
        description: "Failed to confirm order",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500', text: 'Pending' },
      confirmed: { color: 'bg-blue-500', text: 'Confirmed' },
      picked_up: { color: 'bg-purple-500', text: 'Picked Up' },
      in_transit: { color: 'bg-orange-500', text: 'In Transit' },
      delivered: { color: 'bg-green-500', text: 'Delivered' },
      cancelled: { color: 'bg-red-500', text: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-green-800">Farmer Dashboard</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleVoiceRecording}
            disabled={isRecording}
            className={`${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-600'} hover:bg-green-700`}
          >
            <Mic className="w-4 h-4 mr-2" />
            {isRecording ? 'Recording...' : 'Voice Add Crops'}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Crop Manually
          </Button>
        </div>
      </div>

      {voiceText && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Voice Input Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700">"{voiceText}"</p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="crops">My Crops</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Crops</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.crops.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.crops.available} available
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.orders.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.orders.pending} pending
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{stats.earnings.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.orders.delivered} orders completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.orders.pending}</div>
                  <p className="text-xs text-muted-foreground">
                    Need confirmation
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders from restaurants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{order.restaurantId.profile.name}</h4>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {order.crops.map(crop => `${crop.quantity} ${crop.unit} ${crop.cropId.name}`).join(', ')}
                      </p>
                      <p className="text-sm font-medium">₹{order.totalAmount}</p>
                    </div>
                    {order.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => confirmOrder(order._id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Confirm
                        </Button>
                        <Button size="sm" variant="outline">
                          <XCircle className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crops" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {crops.map((crop) => (
              <Card key={crop._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{crop.name}</CardTitle>
                      <CardDescription>{crop.category}</CardDescription>
                    </div>
                    <Badge variant={crop.status === 'available' ? 'default' : 'secondary'}>
                      {crop.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">{crop.description}</p>
                    <div className="flex justify-between">
                      <span className="font-medium">₹{crop.price}/{crop.unit}</span>
                      <span className="text-sm text-gray-600">
                        {crop.availableQuantity}/{crop.quantity} {crop.unit}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {crop.organic && <Badge variant="outline" className="text-green-600">Organic</Badge>}
                      <Badge variant="outline">{crop.quality}</Badge>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Order #{order._id.slice(-6)}</CardTitle>
                      <CardDescription>
                        From {order.restaurantId.profile.name} • {new Date(order.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Items:</h4>
                      <ul className="space-y-1">
                        {order.crops.map((crop, index) => (
                          <li key={index} className="text-sm">
                            {crop.quantity} {crop.unit} {crop.cropId.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total: ₹{order.totalAmount}</span>
                      {order.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => confirmOrder(order._id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Confirm Order
                          </Button>
                          <Button size="sm" variant="outline">
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Earnings Overview</CardTitle>
              <CardDescription>Your farming income summary</CardDescription>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">₹{stats.earnings.total}</div>
                    <p className="text-gray-600">Total Earnings</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{stats.orders.delivered}</div>
                      <p className="text-sm text-gray-600">Orders Completed</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.crops.sold}</div>
                      <p className="text-sm text-gray-600">Crops Sold</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        ₹{stats.orders.delivered > 0 ? Math.round(stats.earnings.total / stats.orders.delivered) : 0}
                      </div>
                      <p className="text-sm text-gray-600">Avg per Order</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
