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
      onOpenDemo(product.name || product.title);
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
            background: 'var(--bg-sage-soft)', 
            border: '1px solid var(--border)', 
            color: 'var(--text-muted)', 
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
        <div className="product-icon-wrapper" style={isUpcoming ? { background: 'transparent', color: 'var(--text-muted)' } : {}}>
          {renderIcon(product.icon || product.iconKey || 'Layers')}
        </div>
        <h3 className="product-name">{product.name || product.title}</h3>
        <p className="product-desc">{product.description}</p>
        
        {product.features && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-heading)' }}>Features: </strong> {product.features}
          </div>
        )}
      </div>

      <div className="product-card-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', width: '100%', gap: '0.5rem', flexWrap: 'wrap' }}>
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
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              fontWeight: 600,
              color: '#000',
              outline: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {hasExternalUrl ? 'Learn More' : 'Request Demo'} 
            <FiArrowRight size={16} style={{ color: '#000' }} />
          </a>
        )}

        <button 
          onClick={() => onOpenTicket(product.id, product.name || product.title)} 
          className="btn-action" 
          title="Raise support ticket"
          style={{ 
            borderRadius: '50px', 
            padding: '0.4rem 0.8rem', 
            fontSize: '0.75rem', 
            display: 'flex', 
            gap: '0.25rem', 
            alignItems: 'center', 
            background: 'transparent', 
            color: '#000', 
            border: 'none',
            boxShadow: 'none',
            outline: 'none',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <FiLifeBuoy size={12} style={{ color: '#000' }} /> Support
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
