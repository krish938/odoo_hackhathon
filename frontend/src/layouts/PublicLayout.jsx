import React from 'react';

const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-page-bg">
      {children}
    </div>
  );
};

export default PublicLayout;
