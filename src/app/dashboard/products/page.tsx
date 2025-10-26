'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search,
  Edit,
  Trash2,
  Eye,
  Camera,
  Package,
  DollarSign,
  Calendar,
  Star
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
  harvestDate: string;
  createdAt: string;
}

export default function ProductsPage() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCrop, setShowAddCrop] = useState(false);

  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/farmer/crops', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setCrops(data.data.crops);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch crops',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCrops = crops.filter(crop =>
    crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crop.category.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Products</h1>
          <p className="text-muted-foreground">Manage your crops and inventory</p>
        </div>
        <Dialog open={showAddCrop} onOpenChange={setShowAddCrop}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <AddCropForm onSuccess={() => {
              setShowAddCrop(false);
              fetchCrops();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCrops.map((crop) => (
          <Card key={crop._id} className="overflow-hidden">
            <div className="aspect-video bg-muted relative">
              {crop.images.length > 0 ? (
                <img
                  src={crop.images[0]}
                  alt={crop.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge variant={crop.status === 'available' ? 'default' : 'secondary'}>
                  {crop.status}
                </Badge>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {crop.name}
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>{crop.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Price:</span>
                  <span className="font-medium">₹{crop.price}/{crop.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Available:</span>
                  <span className="font-medium">{crop.availableQuantity} {crop.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Category:</span>
                  <Badge variant="outline">{crop.category}</Badge>
                </div>
                {crop.organic && (
                  <Badge variant="secondary" className="w-fit">Organic</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCrops.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? 'No products match your search.' : 'You haven\'t added any products yet.'}
            </p>
            <Button onClick={() => setShowAddCrop(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Product
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Add Crop Form Component
function AddCropForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    unit: 'kg',
    category: 'vegetables',
    quantity: '',
    harvestDate: '',
    organic: false,
    quality: 'good'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/farmer/crops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          quantity: parseFloat(formData.quantity),
          harvestDate: new Date(formData.harvestDate),
          location: {
            coordinates: [78.4867, 17.3850],
            address: 'Hyderabad, Telangana'
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Product added successfully'
        });
        onSuccess();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to add product',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add product',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vegetables">Vegetables</SelectItem>
              <SelectItem value="fruits">Fruits</SelectItem>
              <SelectItem value="grains">Grains</SelectItem>
              <SelectItem value="spices">Spices</SelectItem>
              <SelectItem value="herbs">Herbs</SelectItem>
              <SelectItem value="flowers">Flowers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="price">Price (₹)</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="unit">Unit</Label>
          <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">Kilogram</SelectItem>
              <SelectItem value="dozen">Dozen</SelectItem>
              <SelectItem value="piece">Piece</SelectItem>
              <SelectItem value="quintal">Quintal</SelectItem>
              <SelectItem value="ton">Ton</SelectItem>
              <SelectItem value="bunch">Bunch</SelectItem>
              <SelectItem value="bag">Bag</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="harvestDate">Harvest Date</Label>
          <Input
            id="harvestDate"
            type="date"
            value={formData.harvestDate}
            onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="quality">Quality</Label>
          <Select value={formData.quality} onValueChange={(value) => setFormData({ ...formData, quality: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="average">Average</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="organic"
          checked={formData.organic}
          onChange={(e) => setFormData({ ...formData, organic: e.target.checked })}
        />
        <Label htmlFor="organic">Organic</Label>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Adding...' : 'Add Product'}
      </Button>
    </form>
  );
}
