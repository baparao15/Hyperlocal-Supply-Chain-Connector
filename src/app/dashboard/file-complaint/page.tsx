'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  FileText,
  Upload,
  Camera,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Eye
} from 'lucide-react';

interface Complaint {
  _id: string;
  orderNumber: string;
  type: 'quality' | 'quantity' | 'packaging' | 'other';
  description: string;
  images: string[];
  status: 'pending' | 'under-review' | 'resolved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  response?: string;
}

export default function FileComplaintPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    orderNumber: '',
    type: 'quality',
    description: '',
    images: [] as File[]
  });

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/transporter/complaints', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setComplaints(data.data.complaints);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch complaints',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      formDataToSend.append('orderNumber', formData.orderNumber);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('description', formData.description);
      
      formData.images.forEach((image, index) => {
        formDataToSend.append(`images`, image);
      });

      const response = await fetch('/api/transporter/complaints', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formDataToSend
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Complaint filed successfully'
        });
        setShowForm(false);
        setFormData({
          orderNumber: '',
          type: 'quality',
          description: '',
          images: []
        });
        fetchComplaints();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to file complaint',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to file complaint',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under-review': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'under-review': return <Eye className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
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
          <h1 className="text-3xl font-bold">File Complaint</h1>
          <p className="text-muted-foreground">Report issues with deliveries or quality</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <FileText className="w-4 h-4 mr-2" />
          File New Complaint
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complaints.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complaints.filter(c => c.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complaints.filter(c => c.status === 'under-review').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complaints.filter(c => c.status === 'resolved').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {complaints.map((complaint) => (
          <Card key={complaint._id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Complaint #{complaint._id.slice(-6)}
                    <Badge className={getStatusColor(complaint.status)}>
                      {getStatusIcon(complaint.status)}
                      <span className="ml-1">{complaint.status}</span>
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Order #{complaint.orderNumber} • {complaint.type} issue
                  </CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(complaint.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{complaint.description}</p>
                </div>

                {complaint.images.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Evidence Images</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {complaint.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {complaint.response && (
                  <div>
                    <h4 className="font-medium mb-2">Response</h4>
                    <p className="text-sm text-muted-foreground">{complaint.response}</p>
                  </div>
                )}

                {complaint.resolvedAt && (
                  <div className="text-sm text-muted-foreground">
                    Resolved on {new Date(complaint.resolvedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* File Complaint Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>File New Complaint</CardTitle>
            <CardDescription>
              Report an issue with a delivery or product quality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orderNumber">Order Number *</Label>
                  <Input
                    id="orderNumber"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    placeholder="Enter order number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Complaint Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quality">Quality Issue</SelectItem>
                      <SelectItem value="quantity">Quantity Mismatch</SelectItem>
                      <SelectItem value="packaging">Packaging Problem</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label>Evidence Images</Label>
                <div className="mt-2">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="images" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 10MB each)</p>
                      </div>
                      <input 
                        id="images" 
                        type="file" 
                        className="hidden" 
                        multiple 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                  
                  {formData.images.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Selected Images:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Evidence ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1">
                  <FileText className="w-4 h-4 mr-2" />
                  File Complaint
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {complaints.length === 0 && !showForm && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No complaints filed</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven't filed any complaints yet. Use the button above to file a new complaint.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <FileText className="w-4 h-4 mr-2" />
              File Your First Complaint
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
