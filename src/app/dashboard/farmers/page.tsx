'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  Search,
  MapPin,
  Star,
  Phone,
  Mail,
  Package,
  DollarSign,
  Filter,
  Eye,
  ShoppingCart
} from 'lucide-react';

interface Farmer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  location: {
    address: string;
    city: string;
    state: string;
    coordinates: [number, number];
  };
  rating: number;
  totalOrders: number;
  crops: Array<{
    _id: string;
    name: string;
    category: string;
    price: number;
    unit: string;
    availableQuantity: number;
    images: string[];
    organic: boolean;
    quality: string;
  }>;
  distance: number;
}

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [distanceFilter, setDistanceFilter] = useState('all');

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/restaurant/farmers', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setFarmers(data.data.farmers);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch farmers',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFarmers = farmers.filter(farmer => {
    const matchesSearch = farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        farmer.location.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || 
                           farmer.crops.some(crop => crop.category === categoryFilter);
    
    const matchesDistance = distanceFilter === 'all' || 
                           (distanceFilter === 'nearby' && farmer.distance <= 20) ||
                           (distanceFilter === 'medium' && farmer.distance > 20 && farmer.distance <= 50) ||
                           (distanceFilter === 'far' && farmer.distance > 50);
    
    return matchesSearch && matchesCategory && matchesDistance;
  });

  const handleOrderCrop = async (farmerId: string, cropId: string, quantity: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/restaurant/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          farmerId,
          cropId,
          quantity
        })
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Order placed successfully'
        });
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
        <h1 className="text-3xl font-bold">Find Farmers</h1>
        <p className="text-muted-foreground">Discover local farmers and their fresh produce</p>
      </div>

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
            <div>
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search farmers or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
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
              <label className="text-sm font-medium">Distance</label>
              <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Distances</SelectItem>
                  <SelectItem value="nearby">Within 20km</SelectItem>
                  <SelectItem value="medium">20-50km</SelectItem>
                  <SelectItem value="far">50km+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setDistanceFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Farmers List */}
      <div className="grid gap-6">
        {filteredFarmers.map((farmer) => (
          <Card key={farmer._id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {farmer.name}
                    <Badge variant="outline">
                      <Star className="w-3 h-3 mr-1" />
                      {farmer.rating.toFixed(1)}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{farmer.location.city}, {farmer.location.state}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      <span>{farmer.crops.length} products</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{farmer.distance}km away</span>
                    </div>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Phone className="w-4 h-4 mr-1" />
                    Call
                  </Button>
                  <Button size="sm" variant="outline">
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Available Products</h4>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {farmer.crops.map((crop) => (
                      <Card key={crop._id} className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium">{crop.name}</h5>
                            <p className="text-sm text-muted-foreground">{crop.category}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-medium">₹{crop.price}/{crop.unit}</span>
                              <span className="text-sm text-muted-foreground">
                                ({crop.availableQuantity} {crop.unit} available)
                              </span>
                            </div>
                            <div className="flex gap-1 mt-2">
                              {crop.organic && (
                                <Badge variant="secondary" className="text-xs">Organic</Badge>
                              )}
                              <Badge variant="outline" className="text-xs">{crop.quality}</Badge>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button size="sm" variant="outline">
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleOrderCrop(farmer._id, crop._id, 1)}
                            >
                              <ShoppingCart className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFarmers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farmers found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || categoryFilter !== 'all' || distanceFilter !== 'all' 
                ? 'No farmers match your current filters.' 
                : 'No farmers are available in your area.'}
            </p>
            {(searchTerm || categoryFilter !== 'all' || distanceFilter !== 'all') && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setDistanceFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
