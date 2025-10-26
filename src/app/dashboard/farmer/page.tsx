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
  Plus, 
  Mic, 
  Upload, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  MapPin,
  Calendar,
  Star,
  Edit,
  Trash2,
  Eye,
  Camera,
  MicIcon
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

interface DashboardStats {
  totalCrops: number;
  availableCrops: number;
  totalOrders: number;
  pendingOrders: number;
  totalEarnings: number;
  monthlyEarnings: number;
  rating: number;
  totalRatings: number;
}

export default function FarmerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCrops: 0,
    availableCrops: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalEarnings: 0,
    monthlyEarnings: 0,
    rating: 0,
    totalRatings: 0
  });
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [showAddCrop, setShowAddCrop] = useState(false);
  const [showVoiceOrder, setShowVoiceOrder] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsRes, cropsRes] = await Promise.all([
        fetch('/api/farmer/dashboard-stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/farmer/crops', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const statsData = await statsRes.json();
      const cropsData = await cropsRes.json();

      if (statsData.success) setStats(statsData.data);
      if (cropsData.success) setCrops(cropsData.data.crops);
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

  const startVoiceRecording = () => {
    setIsVoiceRecording(true);
    // Voice recording logic will be implemented here
    setTimeout(() => {
      setIsVoiceRecording(false);
      setShowVoiceOrder(true);
    }, 3000);
  };

  const processVoiceOrder = async (voiceText: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/farmer/voice-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          voiceText,
          location: {
            coordinates: [78.4867, 17.3850], // Hyderabad coordinates
            address: 'Hyderabad, Telangana'
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Voice Order Processed',
          description: `${result.data.crops.length} crops added from voice input`
        });
        fetchDashboardData();
        setShowVoiceOrder(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process voice order',
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
          <h1 className="text-3xl font-bold tracking-tight">Farmer Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your crops and orders</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={startVoiceRecording} disabled={isVoiceRecording} size="lg">
            <Mic className="w-5 h-5 mr-2" />
            {isVoiceRecording ? 'Recording...' : 'Voice Order'}
          </Button>
          <Dialog open={showAddCrop} onOpenChange={setShowAddCrop}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Add Crop
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader className="pb-4 border-b">
                <DialogTitle className="text-2xl font-bold">Add New Crop</DialogTitle>
              </DialogHeader>
              <AddCropForm onSuccess={() => {
                setShowAddCrop(false);
                fetchDashboardData();
              }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Crops</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCrops}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.availableCrops} available
            </p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
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
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            {stats.rating > 0 ? (
              <>
                <div className="text-3xl font-bold">{stats.rating.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {stats.totalRatings || 0} reviews
                </p>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold text-muted-foreground">No ratings yet</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Get rated by restaurants
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="crops" className="space-y-4">
        <TabsList>
          <TabsTrigger value="crops">My Crops</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="crops" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {crops.map((crop) => (
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
                      <Camera className="w-12 h-12 text-muted-foreground opacity-50" />
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
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="rounded-full">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-full text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
                      <span className="text-sm text-muted-foreground">Category:</span>
                      <Badge variant="outline" className="font-semibold capitalize">{crop.category}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Orders for your crops</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No orders yet. Your orders will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Your farming performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analytics will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Voice Order Dialog */}
      <Dialog open={showVoiceOrder} onOpenChange={setShowVoiceOrder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voice Order</DialogTitle>
          </DialogHeader>
          <VoiceOrderForm onProcess={processVoiceOrder} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Common crop presets with default details
const commonCrops = {
  'Tomato': { 
    category: 'vegetables', 
    unit: 'kg', 
    price: 30, 
    weightPerUnit: 1,
    description: 'Fresh red tomatoes, freshly harvested'
  },
  'Onion': { 
    category: 'vegetables', 
    unit: 'kg', 
    price: 40, 
    weightPerUnit: 1,
    description: 'Fresh onions, good quality'
  },
  'Potato': { 
    category: 'vegetables', 
    unit: 'kg', 
    price: 50, 
    weightPerUnit: 1,
    description: 'Fresh potatoes'
  },
  'Rice': { 
    category: 'grains', 
    unit: 'kg', 
    price: 60, 
    weightPerUnit: 1,
    description: 'High quality rice'
  },
  'Wheat': { 
    category: 'grains', 
    unit: 'kg', 
    price: 30, 
    weightPerUnit: 1,
    description: 'Fresh wheat grain'
  },
  'Chilli': { 
    category: 'vegetables', 
    unit: 'kg', 
    price: 80, 
    weightPerUnit: 1,
    description: 'Spicy fresh chillies'
  },
  'Lady Finger': { 
    category: 'vegetables', 
    unit: 'kg', 
    price: 60, 
    weightPerUnit: 1,
    description: 'Fresh lady finger (bhindi)'
  },
  'Brinjal': { 
    category: 'vegetables', 
    unit: 'kg', 
    price: 45, 
    weightPerUnit: 1,
    description: 'Fresh brinjal (baingan)'
  },
  'Cabbage': { 
    category: 'vegetables', 
    unit: 'kg', 
    price: 35, 
    weightPerUnit: 1,
    description: 'Fresh cabbage'
  },
  'Cauliflower': { 
    category: 'vegetables', 
    unit: 'kg', 
    price: 40, 
    weightPerUnit: 1,
    description: 'Fresh cauliflower'
  },
  'Carrot': { 
    category: 'vegetables', 
    unit: 'kg', 
    price: 50, 
    weightPerUnit: 1,
    description: 'Fresh carrots'
  },
  'Coriander': { 
    category: 'herbs', 
    unit: 'bunch', 
    price: 10, 
    weightPerUnit: 0.1,
    description: 'Fresh coriander leaves'
  },
  'Green Chilli': { 
    category: 'vegetables', 
    unit: 'kg', 
    price: 100, 
    weightPerUnit: 1,
    description: 'Fresh green chillies'
  }
};

// Add Crop Form Component
function AddCropForm({ onSuccess }: { onSuccess: () => void }) {
  const [useQuickAdd, setUseQuickAdd] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    unit: 'kg',
    category: 'vegetables',
    quantity: '',
    harvestDate: '',
    organic: false,
    quality: 'good',
    weightPerUnit: ''
  });
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    try {
      const files = Array.from(e.target.files);
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('/api/upload/single', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        const result = await response.json();
        if (result.success && result.data && result.data.url) {
          uploadedUrls.push(result.data.url);
        }
      }

      setImages([...images, ...uploadedUrls]);
      toast({
        title: 'Images Uploaded',
        description: `${uploadedUrls.length} image(s) uploaded successfully`
      });
    } catch (error) {
      toast({
        title: 'Upload Error',
        description: 'Failed to upload images',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Auto-fill form when crop name is selected
  const handleCropSelect = (cropName: string) => {
    const crop = commonCrops[cropName as keyof typeof commonCrops];
    if (crop) {
      setFormData({
        ...formData,
        name: cropName,
        category: crop.category,
        unit: crop.unit,
        price: crop.price.toString(),
        description: crop.description,
        weightPerUnit: crop.weightPerUnit.toString()
      });
    } else {
      setFormData({
        ...formData,
        name: cropName,
        unit: 'kg',
        weightPerUnit: '1'
      });
    }
  };

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
          weightPerUnit: parseFloat(formData.weightPerUnit) || 1,
          harvestDate: new Date(formData.harvestDate),
          images: images,
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
          description: 'Crop added successfully'
        });
        onSuccess();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to add crop',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add crop',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Quick Select Common Crops */}
      <div>
        <Label className="mb-2 block">Quick Select Common Crops</Label>
        <div className="flex flex-wrap gap-2">
          {Object.keys(commonCrops).slice(0, 6).map((cropName) => (
            <Button
              key={cropName}
              type="button"
              variant={formData.name === cropName ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCropSelect(cropName)}
            >
              {cropName}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Click a crop above to auto-fill details, or enter a custom crop name below
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Crop Name</Label>
          <Input
            id="name"
            placeholder="e.g., Tomato, Onion, Rice..."
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
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Describe your crop..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <Label htmlFor="price">Price per Unit (₹)</Label>
          <Input
            id="price"
            type="number"
            placeholder="0"
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
              <SelectItem value="kg">kg</SelectItem>
              <SelectItem value="dozen">dozen</SelectItem>
              <SelectItem value="piece">piece</SelectItem>
              <SelectItem value="quintal">quintal</SelectItem>
              <SelectItem value="ton">ton</SelectItem>
              <SelectItem value="bunch">bunch</SelectItem>
              <SelectItem value="bag">bag</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="quantity">Available Quantity</Label>
          <Input
            id="quantity"
            type="number"
            placeholder="100"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="weightPerUnit">Weight/Unit (kg)</Label>
          <Input
            id="weightPerUnit"
            type="number"
            placeholder="1"
            step="0.1"
            value={formData.weightPerUnit}
            onChange={(e) => setFormData({ ...formData, weightPerUnit: e.target.value })}
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
        <Label htmlFor="organic">🌱 Organic</Label>
      </div>

      {/* Image Upload Section */}
      <div>
        <Label>Upload Crop Images (Optional)</Label>
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            disabled={isUploading}
            className="hidden"
            id="crop-images"
          />
          <Label htmlFor="crop-images" className="cursor-pointer">
            <Camera className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isUploading ? 'Uploading...' : 'Click to upload crop images'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You can upload multiple images
            </p>
          </Label>
        </div>
        
        {/* Preview Uploaded Images */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            {images.map((url, index) => (
              <div key={index} className="relative aspect-square border rounded-lg overflow-hidden">
                <img src={url} alt={`Crop ${index + 1}`} className="w-full h-full object-cover" />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute top-1 right-1"
                  onClick={() => removeImage(index)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" disabled={isLoading || isUploading} className="w-full" size="lg">
        {isLoading ? 'Adding...' : isUploading ? 'Uploading...' : 'Add Crop'}
      </Button>
    </form>
  );
}

// Voice Order Form Component
function VoiceOrderForm({ onProcess }: { onProcess: (text: string) => void }) {
  const [voiceText, setVoiceText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (voiceText.trim()) {
      onProcess(voiceText);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="voiceText">Voice Input Text</Label>
        <Textarea
          id="voiceText"
          value={voiceText}
          onChange={(e) => setVoiceText(e.target.value)}
          placeholder="e.g., I have 50 kg of fresh tomatoes, 30 kg of onions, and 20 dozen mangoes available..."
          required
        />
      </div>
      <Button type="submit" className="w-full">
        Process Voice Order
      </Button>
    </form>
  );
}
