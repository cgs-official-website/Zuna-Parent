import React from 'react';

const Skeleton = ({ width = '100%', height = '20px', borderRadius = '4px', className = '' }) => {
  return (
    <div 
      className={`skeleton-loader ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--admin-card-bg) 25%, var(--admin-border) 50%, var(--admin-card-bg) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-loading 1.5s infinite'
      }}
    />
  );
};

export default Skeleton;
