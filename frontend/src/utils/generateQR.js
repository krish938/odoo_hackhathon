export const generateUPIQRString = (upiId, amount, transactionNote = 'OrderPayment') => {
  if (!upiId) return '';
  
  const params = new URLSearchParams({
    pa: upiId,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: transactionNote,
  });
  
  return `upi://pay?${params.toString()}`;
};

export const validateUPIId = (upiId) => {
  if (!upiId) return false;
  
  // Basic UPI ID validation (should contain @ and have valid format)
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
  return upiRegex.test(upiId);
};

export const formatUPIId = (upiId) => {
  if (!upiId) return '';
  
  // Format UPI ID for display (mask some characters for privacy)
  const [username, domain] = upiId.split('@');
  if (!username || !domain) return upiId;
  
  // Show first 2 and last 2 characters of username
  const maskedUsername = username.length > 4 
    ? `${username.substring(0, 2)}***${username.substring(username.length - 2)}`
    : username;
  
  return `${maskedUsername}@${domain}`;
};
