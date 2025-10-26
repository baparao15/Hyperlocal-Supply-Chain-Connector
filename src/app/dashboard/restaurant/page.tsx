'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Search, 
  MapPin, 
  Filter, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  Users, 
  TrendingUp,
  Star,
  Clock,
  Truck,
  Eye,
  Plus,
  Minus,
  CheckCircle,
  Trash2
} from 'lucide-react';

interface Crop {
  _id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  quantity: number;
  availableQuantity: number;
  images: string[];
  status: string;
  organic: boolean;
  quality: string;
  farmerId: {
    _id: string;
    profile: {
      name: string;
      location: {
        address: string;
        coordinates: number[];
      };
    };
    rating: number;
  };
  location: {
    coordinates: number[];
    address: string;
  };
  distance?: number;
}

interface Order {
  _id: string;
  crops: Array<{
    cropId: Crop;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  deliveryFee: number;
  status: string;
  createdAt: string;
  farmerId: {
    profile: {
      name: string;
      location: {
        address: string;
      };
    };
  };
}

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalSpent: number;
  monthlySpent: number;
  activeFarmers: number;
}

export default function RestaurantDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalSpent: 0,
    monthlySpent: 0,
    activeFarmers: 0
  });
  const [crops, setCrops] = useState<Crop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    minPrice: '',
    maxPrice: '',
    organic: 'all',
    quality: 'all',
    maxDistance: '40'
  });
  const [cart, setCart] = useState<Array<{ crop: Crop; quantity: number }>>([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchNearbyCrops(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Fallback to Hyderabad coordinates
          fetchNearbyCrops(17.3850, 78.4867);
        }
      );
    } else {
      fetchNearbyCrops(17.3850, 78.4867);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsRes, ordersRes] = await Promise.all([
        fetch('/api/restaurant/dashboard-stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/restaurant/orders', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();

      if (statsData.success) setStats(statsData.data);
      if (ordersData.success) setOrders(ordersData.data.orders);
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

  const fetchNearbyCrops = async (lat: number, lng: number) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lng.toString(),
        maxDistance: filters.maxDistance,
        ...(filters.category && filters.category !== 'all' && { category: filters.category }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.organic && filters.organic !== 'all' && { organic: filters.organic }),
        ...(filters.quality && filters.quality !== 'all' && { quality: filters.quality })
      });

      const response = await fetch(`/api/restaurant/crops?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        setCrops(result.data.crops);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch crops',
        variant: 'destructive'
      });
    }
  };

  const addToCart = (crop: Crop, quantity: number) => {
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
      title: 'Added to Cart',
      description: `${quantity} ${crop.unit} of ${crop.name} added to cart`
    });
  };

  const removeFromCart = (cropId: string) => {
    setCart(cart.filter(item => item.crop._id !== cropId));
  };

  const updateCartQuantity = (cropId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cropId);
    } else {
      setCart(cart.map(item => 
        item.crop._id === cropId 
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const placeOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/restaurant/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          crops: cart.map(item => ({
            cropId: item.crop._id,
            quantity: item.quantity
          })),
          deliveryLocation: {
            coordinates: [78.4867, 17.3850], // Current location
            address: 'Restaurant Address, Hyderabad'
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Order Placed',
          description: 'Your order has been placed successfully'
        });
        setCart([]);
        setShowCart(false);
        fetchDashboardData();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to place order',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to place order',
        variant: 'destructive'
      });
    }
  };

  const filteredCrops = crops.filter(crop =>
    crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crop.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crop.farmerId.profile.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold tracking-tight">Restaurant Dashboard</h1>
          <p className="text-muted-foreground mt-1">Discover fresh ingredients from local farmers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="lg" onClick={() => setShowCart(true)} className="relative">
            <ShoppingCart className="w-5 h-5 mr-2" />
            <span className="font-medium">Cart</span>
            {cart.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs font-semibold">
                {cart.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingOrders} pending
            </p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{stats.totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ₹{stats.monthlySpent.toLocaleString()} this month
            </p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Farmers</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeFarmers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In your area
            </p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cart Items</CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Package className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cart.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready to order
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Find Fresh Ingredients</CardTitle>
          <CardDescription>Search and filter crops from nearby farmers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-semibold">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search crops, farmers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="maxDistance" className="text-sm font-semibold">Max Distance</Label>
              <Select value={filters.maxDistance} onValueChange={(value) => setFilters({ ...filters, maxDistance: value })}>
                <SelectTrigger className="h-11 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 km</SelectItem>
                  <SelectItem value="20">20 km</SelectItem>
                  <SelectItem value="30">30 km</SelectItem>
                  <SelectItem value="40">40 km</SelectItem>
                  <SelectItem value="50">50 km</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="category" className="text-sm font-semibold">Category</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                <SelectTrigger className="h-11 mt-1">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="vegetables">Vegetables</SelectItem>
                  <SelectItem value="fruits">Fruits</SelectItem>
                  <SelectItem value="grains">Grains</SelectItem>
                  <SelectItem value="spices">Spices</SelectItem>
                  <SelectItem value="herbs">Herbs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="minPrice" className="text-sm font-semibold">Min Price (₹)</Label>
              <Input
                id="minPrice"
                type="number"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className="h-11 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="maxPrice" className="text-sm font-semibold">Max Price (₹)</Label>
              <Input
                id="maxPrice"
                type="number"
                placeholder="1000"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="h-11 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="quality" className="text-sm font-semibold">Quality</Label>
              <Select value={filters.quality} onValueChange={(value) => setFilters({ ...filters, quality: value })}>
                <SelectTrigger className="h-11 mt-1">
                  <SelectValue placeholder="All Quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quality</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={() => getCurrentLocation()} className="w-full h-11 text-base font-semibold">
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters & Refresh
          </Button>
        </CardContent>
      </Card>

      {/* Crops Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCrops.map((crop) => (
          <Card key={crop._id} className="overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:border-primary">
            <div className="aspect-video bg-gradient-to-br from-green-100 to-blue-100 relative overflow-hidden">
              {crop.images.length > 0 ? (
                <img
                  src={crop.images[0]}
                  alt={crop.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="w-12 h-12 text-muted-foreground opacity-50" />
                </div>
              )}
              <div className="absolute top-3 right-3">
                <Badge variant={crop.status === 'available' ? 'default' : 'secondary'} className="font-semibold">
                  {crop.status}
                </Badge>
              </div>
              {crop.organic && (
                <Badge variant="secondary" className="absolute top-3 left-3 font-semibold bg-green-500 text-white">
                  🌱 Organic
                </Badge>
              )}
            </div>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-xl">
                {crop.name}
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-bold">{crop.farmerId.rating.toFixed(1)}</span>
                </div>
              </CardTitle>
              <CardDescription className="line-clamp-2">{crop.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Price:</span>
                  <span className="font-bold text-lg text-green-600">₹{crop.price}/{crop.unit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Available:</span>
                  <span className="font-semibold">{crop.availableQuantity} {crop.unit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Farmer:</span>
                  <span className="font-semibold">{crop.farmerId.profile.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Distance:
                  </span>
                  <span className="font-semibold">{crop.distance?.toFixed(1) || 'N/A'} km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Quality:</span>
                  <Badge variant="outline" className="capitalize font-semibold">{crop.quality}</Badge>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <Button 
                  size="lg" 
                  className="flex-1 font-semibold"
                  onClick={() => addToCart(crop, 1)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add to Cart
                </Button>
                <Button size="lg" variant="outline">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl font-bold">Shopping Cart</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                <p className="text-lg text-muted-foreground font-medium">Your cart is empty</p>
                <p className="text-sm text-muted-foreground mt-2">Start adding items to get started!</p>
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.crop._id} className="flex items-center justify-between p-4 border-2 rounded-xl hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.crop.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        ₹{item.crop.price}/{item.crop.unit} • {item.crop.farmerId.profile.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => updateCartQuantity(item.crop._id, item.quantity - 1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-10 text-center font-bold text-lg">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => updateCartQuantity(item.crop._id, item.quantity + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.crop._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="border-t-2 pt-4 mt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">
                      Total: ₹{cart.reduce((sum, item) => sum + (item.crop.price * item.quantity), 0).toLocaleString()}
                    </span>
                    <Button onClick={placeOrder} size="lg" className="ml-4 font-semibold">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Place Order
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
