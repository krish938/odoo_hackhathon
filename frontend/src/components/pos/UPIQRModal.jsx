import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '../../utils/formatCurrency';
import { generateUPIQRString } from '../../utils/generateQR';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Smartphone, Check, X } from 'lucide-react';

const UPIQRModal = ({ isOpen, onClose, upiId, amount, onConfirm }) => {
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  
  if (!upiId || !amount) return null;
  
  const upiString = generateUPIQRString(upiId, amount);
  
  const handleConfirm = () => {
    setPaymentConfirmed(true);
    setTimeout(() => {
      onConfirm(true);
    }, 1000);
  };
  
  const handleCancel = () => {
    onConfirm(false);
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="UPI Payment"
      size="md"
      showCloseButton={false}
    >
      <div className="text-center">
        {paymentConfirmed ? (
          <div className="py-8">
            <div className="mx-auto h-16 w-16 bg-success rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Payment Confirmed!
            </h3>
            <p className="text-gray-600">
              Processing your payment...
            </p>
          </div>
        ) : (
          <>
            {/* QR Code */}
            <div className="bg-white p-4 rounded-lg inline-block mb-6">
              <QRCodeSVG
                value={upiString}
                size={200}
                level="H"
                marginSize={4}
              />
            </div>
            
            {/* Payment Details */}
            <div className="mb-6 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Amount:</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">UPI ID:</span>
                <span className="font-medium">{upiId}</span>
              </div>
            </div>
            
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Smartphone className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                <div className="text-left">
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    How to pay:
                  </p>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Open any UPI payment app</li>
                    <li>Scan the QR code above</li>
                    <li>Verify the payment details</li>
                    <li>Complete the payment</li>
                    <li>Click "Payment Confirmed" below</li>
                  </ol>
                </div>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="mb-6">
              <Badge variant="info">
                Waiting for payment confirmation...
              </Badge>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Payment Confirmed
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default UPIQRModal;
