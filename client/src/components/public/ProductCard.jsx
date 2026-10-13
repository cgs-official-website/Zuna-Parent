import React from 'react';
import {
  FiLayers,
  FiActivity,
  FiBook,
  FiBriefcase,
  FiHeart,
  FiClock,
  FiArrowRight,
  FiLifeBuoy,
  FiGrid,
  FiCalendar,
  FiCheckSquare
} from 'react-icons/fi';

const iconMap = {
  Layers: FiLayers,
  Activity: FiActivity,
  Book: FiBook,
  Briefcase: FiBriefcase,
  Heart: FiHeart,
  Grid: FiGrid,
  Calendar: FiCalendar,
  CheckSquare: FiCheckSquare
};

const ProductCard = ({ product, onOpenDemo, onOpenTicket }) => {
  const renderIcon = (iconName) => {
    const IconComponent = iconMap[iconName] || FiLayers;
    return <IconComponent size={24} />;
  };

  const isUpcoming = product.status === 'Upcoming';
  const isInactive = product.status === 'Inactive';
  const rawUrl = product.productUrl || (product.url && product.url !== '#products' ? product.url : '');
  const hasExternalUrl = rawUrl && /^https?:\/\//i.test(rawUrl.trim());
  const targetUrl = hasExternalUrl ? rawUrl.trim() : '#products';

  const handleLinkClick = (e) => {
    if (isUpcoming || isInactive) {
      e.preventDefault();
      return;
    }
    if (!hasExternalUrl) {
      e.preventDefault();
      onOpenDemo(product.name);
    }
  };

  return (
    <div 
      className="product-card reveal"
      style={{
        position: 'relative',
        opacity: isUpcoming ? 0.78 : (isInactive ? 0.6 : 1),
        filter: isUpcoming ? 'grayscale(15%)' : 'none'
      }}
    >
      {isUpcoming && (
        <span 
          style={{ 
            position: 'absolute', 
            top: '1.25rem', 
            right: '1.25rem', 
            background: 'rgba(148, 163, 184, 0.12)', 
            border: '1px solid rgba(148, 163, 184, 0.25)', 
            color: '#94a3b8', 
            padding: '0.25rem 0.65rem', 
            borderRadius: '50px', 
            fontSize: '0.72rem', 
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}
          title="This product is coming soon"
        >
          Upcoming
        </span>
      )}

      <div className="product-card-top">
        <div className="product-icon-wrapper" style={isUpcoming ? { background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8' } : {}}>
          {renderIcon(product.icon || 'Layers')}
        </div>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-desc">{product.description}</p>
        
        {product.features && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Features: </strong> {product.features}
          </div>
        )}
      </div>

      <div className="product-card-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', width: '100%', gap: '0.5rem' }}>
        {isUpcoming ? (
          <span 
            className="product-link disabled"
            title="This product is coming soon"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              fontWeight: 600, 
              color: '#64748b', 
              cursor: 'not-allowed', 
              opacity: 0.7 
            }}
          >
            Coming Soon <FiClock size={15} />
          </span>
        ) : (
          <a 
            href={targetUrl}
            target={hasExternalUrl ? "_blank" : "_self"}
            rel={hasExternalUrl ? "noopener noreferrer" : ""}
            onClick={handleLinkClick}
            className="product-link"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
          >
            {hasExternalUrl ? 'Learn More' : 'Request Demo'} 
            <FiArrowRight size={16} />
          </a>
        )}

        <button 
          onClick={() => onOpenTicket(product.id, product.name)} 
          className="btn-action" 
          title="Raise support ticket"
          style={{ borderRadius: '50px', padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem', alignItems: 'center', background: 'rgba(255, 195, 0, 0.1)', color: 'var(--accent)', border: '1px solid rgba(255, 195, 0, 0.2)' }}
        >
          <FiLifeBuoy size={12} /> Support
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
