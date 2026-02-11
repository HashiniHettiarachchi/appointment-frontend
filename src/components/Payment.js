import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Payment.css';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { appointmentId, amount, serviceName } = location.state || {};
  
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    let { name, value } = e.target;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (value.length > 19) return; // 16 digits + 3 spaces
    }
    
    // Format expiry date
    if (name === 'expiryDate') {
      value = value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
      }
      if (value.length > 5) return;
    }
    
    // CVV limit
    if (name === 'cvv' && value.length > 4) return;
    
    setCardDetails({ ...cardDetails, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    const cardNum = cardDetails.cardNumber.replace(/\s/g, '');
    if (cardNum.length !== 16) {
      setError('Please enter a valid 16-digit card number');
      setLoading(false);
      return;
    }

    if (!cardDetails.expiryDate.match(/^\d{2}\/\d{2}$/)) {
      setError('Please enter expiry date in MM/YY format');
      setLoading(false);
      return;
    }

    if (cardDetails.cvv.length < 3) {
      setError('Please enter a valid CVV');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // In real implementation, this would process payment through Stripe
      // For demo, we'll simulate a successful payment
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock payment ID
      const paymentId = 'pay_' + Math.random().toString(36).substr(2, 9);
      
      // Confirm payment with backend
      await axios.post(
        // 'http://localhost:5000/api/payments/confirm',
        'https://appointment-backend-cune.vercel.app/api/payments/confirm',
        {
          appointmentId,
          paymentId,
          paymentMethod: 'online'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Success! Redirect to appointments
      navigate('/appointments', { 
        state: { 
          message: '✅ Payment successful! Your appointment is confirmed.' 
        } 
      });

    } catch (err) {
      console.error('Payment error:', err);
      setError('Payment failed. Please try again or choose cash payment.');
    } finally {
      setLoading(false);
    }
  };

  if (!appointmentId) {
    return (
      <div className="payment-container">
        <div className="error-state">
          <h2>⚠️ No Payment Information</h2>
          <p>Please book an appointment first.</p>
          <button onClick={() => navigate('/book-appointment')} className="btn-primary">
            Book Appointment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <div className="payment-card">
        <div className="payment-header">
          <h2>💳 Secure Payment</h2>
          <p>Complete your booking payment</p>
        </div>

        {/* Payment Summary */}
        <div className="payment-summary">
          <h3>Payment Summary</h3>
          <div className="summary-row">
            <span>Service:</span>
            <strong>{serviceName}</strong>
          </div>
          <div className="summary-row total">
            <span>Total Amount:</span>
            <strong className="amount">${amount}</strong>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="payment-form">
          <div className="form-group">
            <label>Card Number</label>
            <input
              type="text"
              name="cardNumber"
              value={cardDetails.cardNumber}
              onChange={handleChange}
              placeholder="1234 5678 9012 3456"
              required
              className="form-input card-input"
            />
            <div className="card-icons">
              <span>💳</span>
            </div>
          </div>

          <div className="form-group">
            <label>Cardholder Name</label>
            <input
              type="text"
              name="cardName"
              value={cardDetails.cardName}
              onChange={handleChange}
              placeholder="John Doe"
              required
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Expiry Date</label>
              <input
                type="text"
                name="expiryDate"
                value={cardDetails.expiryDate}
                onChange={handleChange}
                placeholder="MM/YY"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>CVV</label>
              <input
                type="password"
                name="cvv"
                value={cardDetails.cvv}
                onChange={handleChange}
                placeholder="123"
                maxLength="4"
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="security-notice">
            <span>🔒</span>
            <p>Your payment information is secure and encrypted</p>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-cancel"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-pay"
              disabled={loading}
            >
              {loading ? 'Processing...' : `Pay $${amount}`}
            </button>
          </div>
        </form>

        <div className="test-card-notice">
          <p><strong>Test Mode:</strong> This is a demo. Use any 16-digit number for testing.</p>
          <p>Test Card: 4242 4242 4242 4242</p>
        </div>
      </div>
    </div>
  );
};

export default Payment;
