const nodemailer = require('nodemailer');
const User = require('../models/User');
const Order = require('../models/Order');

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Send email notification
  async sendEmail(to, subject, html, text = '') {
    try {
      const mailOptions = {
        from: `"Hyperlocal Supply Chain Connector" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Notify farmer about new order
  async notifyFarmerNewOrder(orderId) {
    try {
      const order = await Order.findById(orderId)
        .populate('farmerId', 'email profile.name')
        .populate('restaurantId', 'profile.name profile.location')
        .populate('crops.cropId', 'name quantity');

      if (!order) return { success: false, error: 'Order not found' };

      const farmer = order.farmerId;
      const restaurant = order.restaurantId;
      
      const cropsList = order.crops.map(crop => 
        `• ${crop.cropId.name} - ${crop.quantity} ${crop.unit}`
      ).join('\n');

      const subject = '🌾 New Order Received - Hyperlocal Supply Chain Connector';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2E7D32;">🌾 New Order Received!</h2>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Order Details:</h3>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Restaurant:</strong> ${restaurant.profile.name}</p>
            <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
            <p><strong>Delivery Fee:</strong> ₹${order.deliveryFee}</p>
          </div>

          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Crops Ordered:</h3>
            <pre style="font-family: Arial, sans-serif;">${cropsList}</pre>
          </div>

          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Next Steps:</h3>
            <p>1. Confirm the order in your dashboard</p>
            <p>2. Prepare the crops for pickup</p>
            <p>3. Wait for transporter assignment</p>
          </div>

          <p style="color: #666; font-size: 14px;">
            Login to your Hyperlocal Supply Chain Connector dashboard to manage this order.
          </p>
        </div>
      `;

      return await this.sendEmail(farmer.email, subject, html);
    } catch (error) {
      console.error('Error notifying farmer:', error);
      return { success: false, error: error.message };
    }
  }

  // Notify restaurant about order confirmation
  async notifyRestaurantOrderConfirmed(orderId) {
    try {
      const order = await Order.findById(orderId)
        .populate('restaurantId', 'email profile.name')
        .populate('farmerId', 'profile.name profile.location')
        .populate('crops.cropId', 'name');

      if (!order) return { success: false, error: 'Order not found' };

      const restaurant = order.restaurantId;
      const farmer = order.farmerId;

      const subject = '✅ Order Confirmed - Hyperlocal Supply Chain Connector';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976D2;">✅ Order Confirmed!</h2>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Order Details:</h3>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Farmer:</strong> ${farmer.profile.name}</p>
            <p><strong>Status:</strong> Confirmed</p>
            <p><strong>Estimated Delivery:</strong> ${order.estimatedDeliveryTime.toLocaleDateString()}</p>
          </div>

          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>What's Next:</h3>
            <p>• Your order has been confirmed by the farmer</p>
            <p>• A transporter will be assigned soon</p>
            <p>• You'll receive updates on pickup and delivery</p>
          </div>

          <p style="color: #666; font-size: 14px;">
            Track your order status in your Hyperlocal Supply Chain Connector dashboard.
          </p>
        </div>
      `;

      return await this.sendEmail(restaurant.email, subject, html);
    } catch (error) {
      console.error('Error notifying restaurant:', error);
      return { success: false, error: error.message };
    }
  }

  // Notify transporter about new delivery opportunity
  async notifyTransporterNewDelivery(orderId, transporterEmail) {
    try {
      const order = await Order.findById(orderId)
        .populate('farmerId', 'profile.name profile.location')
        .populate('restaurantId', 'profile.name profile.location');

      if (!order) return { success: false, error: 'Order not found' };

      const subject = '🚛 New Delivery Opportunity - Hyperlocal Supply Chain Connector';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6F00;">🚛 New Delivery Available!</h2>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Delivery Details:</h3>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Distance:</strong> ${order.distance.toFixed(1)} km</p>
            <p><strong>Delivery Fee:</strong> ₹${order.deliveryFee}</p>
            <p><strong>Pickup:</strong> ${order.pickupLocation.address}</p>
            <p><strong>Delivery:</strong> ${order.deliveryLocation.address}</p>
          </div>

          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Earnings:</h3>
            <p style="font-size: 18px; color: #FF6F00;"><strong>₹${order.deliveryFee}</strong></p>
            <p style="font-size: 14px; color: #666;">Full delivery fee for this order</p>
          </div>

          <p style="color: #666; font-size: 14px;">
            Login to your Hyperlocal Supply Chain Connector dashboard to accept this delivery.
          </p>
        </div>
      `;

      return await this.sendEmail(transporterEmail, subject, html);
    } catch (error) {
      console.error('Error notifying transporter:', error);
      return { success: false, error: error.message };
    }
  }

  // Notify about order pickup
  async notifyOrderPickedUp(orderId) {
    try {
      const order = await Order.findById(orderId)
        .populate('restaurantId', 'email profile.name')
        .populate('transporterId', 'profile.name')
        .populate('farmerId', 'profile.name');

      if (!order) return { success: false, error: 'Order not found' };

      const restaurant = order.restaurantId;
      const transporter = order.transporterId;

      const subject = '📦 Order Picked Up - Hyperlocal Supply Chain Connector';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">📦 Order Picked Up!</h2>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Update:</h3>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Transporter:</strong> ${transporter.profile.name}</p>
            <p><strong>Status:</strong> In Transit</p>
            <p><strong>Expected Delivery:</strong> ${order.estimatedDeliveryTime.toLocaleDateString()}</p>
          </div>

          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>🚛 Your order is now on its way!</p>
            <p>The transporter has picked up your crops from the farmer and is heading to your location.</p>
          </div>

          <p style="color: #666; font-size: 14px;">
            Track real-time updates in your Hyperlocal Supply Chain Connector dashboard.
          </p>
        </div>
      `;

      return await this.sendEmail(restaurant.email, subject, html);
    } catch (error) {
      console.error('Error notifying pickup:', error);
      return { success: false, error: error.message };
    }
  }

  // Notify about order delivery
  async notifyOrderDelivered(orderId) {
    try {
      const order = await Order.findById(orderId)
        .populate('restaurantId', 'email profile.name')
        .populate('farmerId', 'email profile.name')
        .populate('transporterId', 'email profile.name');

      if (!order) return { success: false, error: 'Order not found' };

      const restaurant = order.restaurantId;
      const farmer = order.farmerId;
      const transporter = order.transporterId;

      // Notify restaurant
      const restaurantSubject = '🎉 Order Delivered Successfully - Hyperlocal Supply Chain Connector';
      const restaurantHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">🎉 Order Delivered!</h2>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Delivery Completed:</h3>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Delivered At:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Amount:</strong> ₹${order.totalAmount + order.restaurantDeliveryShare}</p>
          </div>

          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Payment Due:</h3>
            <p>Please settle the payment to complete this order.</p>
            <p><strong>Farmer Payment:</strong> ₹${order.totalAmount}</p>
            <p><strong>Delivery Fee:</strong> ₹${order.restaurantDeliveryShare}</p>
          </div>

          <p style="color: #666; font-size: 14px;">
            Login to your dashboard to process payment and rate this order.
          </p>
        </div>
      `;

      // Notify farmer
      const farmerSubject = '💰 Payment Pending - Hyperlocal Supply Chain Connector';
      const farmerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">✅ Order Delivered Successfully!</h2>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Great News:</h3>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Your Earnings:</strong> ₹${order.totalAmount}</p>
            <p><strong>Status:</strong> Awaiting Payment</p>
          </div>

          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>💰 Payment will be processed once the restaurant settles the order.</p>
            <p>You'll receive the money directly in your registered bank account.</p>
          </div>
        </div>
      `;

      // Send notifications
      const results = await Promise.all([
        this.sendEmail(restaurant.email, restaurantSubject, restaurantHtml),
        this.sendEmail(farmer.email, farmerSubject, farmerHtml)
      ]);

      return { success: true, results };
    } catch (error) {
      console.error('Error notifying delivery:', error);
      return { success: false, error: error.message };
    }
  }

  // Notify about payment settlement
  async notifyPaymentSettled(orderId) {
    try {
      const order = await Order.findById(orderId)
        .populate('farmerId', 'email profile.name profile.bankDetails')
        .populate('transporterId', 'email profile.name profile.bankDetails');

      if (!order) return { success: false, error: 'Order not found' };

      const farmer = order.farmerId;
      const transporter = order.transporterId;

      // Notify farmer
      const farmerSubject = '💰 Payment Received - Hyperlocal Supply Chain Connector';
      const farmerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">💰 Payment Received!</h2>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Payment Details:</h3>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Amount:</strong> ₹${order.totalAmount}</p>
            <p><strong>Account:</strong> ***${farmer.profile.bankDetails.accountNumber.slice(-4)}</p>
            <p><strong>Status:</strong> Transferred</p>
          </div>

          <p>🎉 The payment has been successfully transferred to your bank account!</p>
          <p style="color: #666; font-size: 14px;">
            Thank you for using Hyperlocal Supply Chain Connector. Keep growing! 🌱
          </p>
        </div>
      `;

      // Notify transporter if exists
      let transporterResult = { success: true };
      if (transporter) {
        const transporterSubject = '💰 Delivery Payment Received - Hyperlocal Supply Chain Connector';
        const transporterHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF6F00;">💰 Delivery Payment Received!</h2>
            
            <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Payment Details:</h3>
              <p><strong>Order ID:</strong> ${order._id}</p>
              <p><strong>Delivery Fee:</strong> ₹${order.deliveryFee}</p>
              <p><strong>Account:</strong> ***${transporter.profile.bankDetails.accountNumber.slice(-4)}</p>
              <p><strong>Status:</strong> Transferred</p>
            </div>

            <p>🚛 Your delivery payment has been successfully transferred!</p>
            <p style="color: #666; font-size: 14px;">
              Thank you for your service. Keep delivering! 📦
            </p>
          </div>
        `;

        transporterResult = await this.sendEmail(transporter.email, transporterSubject, transporterHtml);
      }

      const farmerResult = await this.sendEmail(farmer.email, farmerSubject, farmerHtml);

      return { 
        success: true, 
        results: { 
          farmer: farmerResult, 
          transporter: transporterResult 
        } 
      };
    } catch (error) {
      console.error('Error notifying payment settlement:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationService();
