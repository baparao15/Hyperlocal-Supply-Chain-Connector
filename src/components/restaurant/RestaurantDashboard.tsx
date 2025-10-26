'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  MapPin, 
  Filter, 
  ShoppingCart, 
  Clock,
  CheckCircle,
  Truck,
  CreditCard,
  Star,
  Package
} from 'lucide-react';
import { toast } from '../ui/use-toast';

interface Farmer {
  _id: string;
  profile: {
    name: string;
    location: {
      coordinates: number[];
      address: string;
    };
  };
  rating: number;
  totalOrders: number;
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
  organic: boolean;
  quality: string;
  images: string[];
  farmerId: {
    profile: {
      name: string;
      location: {
        address: string;
      };
    };
    rating: number;
  };
}

interface Order {
  _id: string;
  status: string;
  totalAmount: number;
  deliveryFee: number;
  paymentStatus: string;
  farmerId: {
    profile: {
      name: string;
    };
  };
  transporterId?: {
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
    price: number;
  }>;
  estimatedDeliveryTime: string;
  createdAt: string;
}

export default function RestaurantDashboard() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<Array<{crop: Crop, quantity: number}>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [maxDistance, setMaxDistance] = useState(40);
  const [organicOnly, setOrganicOnly] = useState(false);

  // User location (in production, get from user profile or geolocation)
  const userLocation = { latitude: 17.3850, longitude: 78.4867 }; // Hyderabad

  useEffect(() => {
    fetchNearbyFarmers();
    fetchCrops();
    fetchOrders();
  }, []);

  const fetchNearbyFarmers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/restaurant/nearby-farmers?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}&maxDistance=${maxDistance}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setFarmers(data.data.farmers);
      }
    } catch (error) {
      console.error('Error fetching farmers:', error);
    }
  };

  const fetchCrops = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `/api/restaurant/crops?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}&maxDistance=${maxDistance}`;
      
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (organicOnly) url += `&organic=true`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const response = await fetch(url, {
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
      const response = await fetch('/api/restaurant/orders', {
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

  const addToCart = (crop: Crop, quantity: number = 1) => {
    const existingItem = cart.find(item => item.crop._id === crop._id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.crop._id === crop._id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, { crop, quantity }]);
    }
    toast({
      title: "Added to Cart",
      description: `${quantity} ${crop.unit} ${crop.name} added to cart`
    });
  };

  const removeFromCart = (cropId: string) => {
    setCart(cart.filter(item => item.crop._id !== cropId));
  };

  const updateCartQuantity = (cropId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cropId);
      return;
    }
    setCart(cart.map(item => 
      item.crop._id === cropId 
        ? { ...item, quantity }
        : item
    ));
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Your cart is empty",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Group cart items by farmer
      const ordersByFarmer = cart.reduce((acc, item) => {
        const farmerId = (item.crop.farmerId as any)?._id || 'unknown';
        if (!acc[farmerId]) {
          acc[farmerId] = [];
        }
        acc[farmerId].push({
          cropId: item.crop._id,
          quantity: item.quantity
        });
        return acc;
      }, {} as Record<string, Array<{cropId: string, quantity: number}>>);

      // Place separate orders for each farmer
      const orderPromises = Object.entries(ordersByFarmer).map(([farmerId, crops]) => {
        return fetch('/api/restaurant/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            crops,
            deliveryLocation: {
              coordinates: [userLocation.longitude, userLocation.latitude],
              address: "Restaurant Location, Hyderabad" // In production, get from user profile
            },
            notes: "Order from restaurant dashboard"
          })
        });
      });

      const responses = await Promise.all(orderPromises);
      const results = await Promise.all(responses.map(r => r.json()));
      
      const successfulOrders = results.filter(r => r.success);
      
      if (successfulOrders.length > 0) {
        toast({
          title: "Success!",
          description: `${successfulOrders.length} order(s) placed successfully`
        });
        setCart([]);
        fetchOrders();
      } else {
        toast({
          title: "Error",
          description: "Failed to place orders",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Error",
        description: "Failed to place order",
        variant: "destructive"
      });
    }
  };

  const settlePayment = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      // First create payment order
      const order = orders.find(o => o._id === orderId);
      if (!order) return;

      const totalAmount = order.totalAmount + (order.deliveryFee / 2); // Restaurant pays half delivery fee

      const paymentResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId,
          amount: totalAmount
        })
      });

      const paymentData = await paymentResponse.json();
      if (!paymentData.success) {
        throw new Error('Failed to create payment order');
      }

      // Simulate payment success (in production, integrate with Razorpay)
      const mockPaymentId = `pay_${Date.now()}`;
      
      // Settle payment
      const settleResponse = await fetch('/api/payment/settle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId,
          razorpayPaymentId: mockPaymentId
        })
      });

      const settleData = await settleResponse.json();
      if (settleData.success) {
        toast({
          title: "Payment Successful!",
          description: "Payment has been settled and money transferred"
        });
        fetchOrders();
      } else {
        toast({
          title: "Error",
          description: settleData.message || "Failed to settle payment",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error settling payment:', error);
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500', text: 'Pending', icon: Clock },
      confirmed: { color: 'bg-blue-500', text: 'Confirmed', icon: CheckCircle },
      picked_up: { color: 'bg-purple-500', text: 'Picked Up', icon: Package },
      in_transit: { color: 'bg-orange-500', text: 'In Transit', icon: Truck },
      delivered: { color: 'bg-green-500', text: 'Delivered', icon: CheckCircle },
      cancelled: { color: 'bg-red-500', text: 'Cancelled', icon: Clock }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const cartTotal = cart.reduce((total, item) => total + (item.crop.price * item.quantity), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-blue-800">Restaurant Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <span className="font-medium">{cart.length} items</span>
            <span className="text-sm text-gray-600">₹{cartTotal}</span>
          </div>
          {cart.length > 0 && (
            <Button onClick={placeOrder} className="bg-green-600 hover:bg-green-700">
              Place Order
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">Browse Crops</TabsTrigger>
          <TabsTrigger value="farmers">Nearby Farmers</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="cart">Cart ({cart.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search crops..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="vegetables">Vegetables</SelectItem>
                    <SelectItem value="fruits">Fruits</SelectItem>
                    <SelectItem value="grains">Grains</SelectItem>
                    <SelectItem value="spices">Spices</SelectItem>
                    <SelectItem value="herbs">Herbs</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Within {maxDistance}km</span>
                </div>
                <Button 
                  variant={organicOnly ? "default" : "outline"}
                  onClick={() => setOrganicOnly(!organicOnly)}
                  className="w-full"
                >
                  Organic Only
                </Button>
              </div>
              <Button onClick={fetchCrops} className="mt-4">
                Apply Filters
              </Button>
            </CardContent>
          </Card>

          {/* Crops Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {crops.map((crop) => (
              <Card key={crop._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{crop.name}</CardTitle>
                      <CardDescription>{crop.farmerId.profile.name}</CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{crop.farmerId.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">{crop.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-600">
                        ₹{crop.price}/{crop.unit}
                      </span>
                      <span className="text-sm text-gray-500">
                        {crop.availableQuantity} {crop.unit} available
                      </span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <Badge variant="outline">{crop.category}</Badge>
                      <Badge variant="outline">{crop.quality}</Badge>
                      {crop.organic && (
                        <Badge variant="outline" className="text-green-600">
                          Organic
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => addToCart(crop, 1)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        disabled={crop.availableQuantity <= 0}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button
                        onClick={() => addToCart(crop, 5)}
                        variant="outline"
                        disabled={crop.availableQuantity < 5}
                      >
                        +5
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="farmers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {farmers.map((farmer) => (
              <Card key={farmer._id}>
                <CardHeader>
                  <CardTitle>{farmer.profile.name}</CardTitle>
                  <CardDescription>{farmer.profile.location.address}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Rating:</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{farmer.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Orders:</span>
                      <span>{farmer.totalOrders}</span>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      View Crops
                    </Button>
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
                        From {order.farmerId.profile.name} • {new Date(order.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(order.status)}
                      {order.transporterId && (
                        <span className="text-sm text-gray-600">
                          Transporter: {order.transporterId.profile.name}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Items:</h4>
                      <ul className="space-y-1">
                        {order.crops.map((crop, index) => (
                          <li key={index} className="flex justify-between text-sm">
                            <span>{crop.quantity} {crop.unit} {crop.cropId.name}</span>
                            <span>₹{crop.price * crop.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span>Subtotal:</span>
                        <span>₹{order.totalAmount}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span>Delivery Fee (50%):</span>
                        <span>₹{order.deliveryFee / 2}</span>
                      </div>
                      <div className="flex justify-between items-center font-bold">
                        <span>Total:</span>
                        <span>₹{order.totalAmount + (order.deliveryFee / 2)}</span>
                      </div>
                    </div>
                    {order.status === 'delivered' && order.paymentStatus === 'pending' && (
                      <Button
                        onClick={() => settlePayment(order._id)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Settle Payment
                      </Button>
                    )}
                    {order.paymentStatus === 'paid' && (
                      <Badge className="bg-green-500 text-white">
                        Payment Completed
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cart" className="space-y-4">
          {cart.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600">Your cart is empty</h3>
                <p className="text-gray-500">Browse crops to add items to your cart</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <Card key={item.crop._id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.crop.name}</h4>
                        <p className="text-sm text-gray-600">
                          From {item.crop.farmerId.profile.name}
                        </p>
                        <p className="text-sm font-medium">
                          ₹{item.crop.price}/{item.crop.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartQuantity(item.crop._id, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartQuantity(item.crop._id, item.quantity + 1)}
                          disabled={item.quantity >= item.crop.availableQuantity}
                        >
                          +
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFromCart(item.crop._id)}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-medium">₹{item.crop.price * item.quantity}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total: ₹{cartTotal}</span>
                    <Button onClick={placeOrder} className="bg-green-600 hover:bg-green-700">
                      Place Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
