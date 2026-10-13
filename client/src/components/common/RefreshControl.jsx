import React, { useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';

export const RefreshButton = ({
  onRefresh,
  isLoading: externalIsLoading,
  buttonLabel = 'Refresh',
  className = '',
  disabled = false,
  style = {}
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalLoading;

  const handleClick = async () => {
    if (isLoading || disabled) return;
    setInternalLoading(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error('Error during refresh action:', err);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <button
      className={`btn btn-secondary admin-refresh-btn ${className}`}
      onClick={handleClick}
      disabled={isLoading || disabled}
      style={{
        padding: '0.55rem 0.95rem',
        fontSize: '0.82rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        ...style
      }}
      aria-label={buttonLabel}
    >
      <FiRefreshCw
        size={15}
        className={isLoading ? 'spin-refresh-icon' : ''}
        style={{ color: 'var(--accent)' }}
      />
      <span>{isLoading ? 'Refreshing...' : buttonLabel}</span>
    </button>
  );
};

export const RefreshStatusSubtitle = ({
  isLoading,
  defaultStatusText = 'Roles, and status for tables',
  loadingText = 'Skeleton loading',
  refreshedText = 'Refreshed just now',
  hasRefreshed = false,
  style = {}
}) => {
  return (
    <p
      aria-live="polite"
      style={{
        margin: '0.2rem 0 0',
        fontSize: '0.84rem',
        color: 'var(--admin-text-muted)',
        minHeight: '1.2rem',
        display: 'flex',
        alignItems: 'center',
        ...style
      }}
    >
      {isLoading ? (
        <span className="skeleton-loading-label" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span className="skeleton-shimmer-text">{loadingText}</span>
          <span className="loading-dots-wrapper" aria-hidden="true" title="Loading in progress">
            <span className="loading-dot" />
            <span className="loading-dot" />
            <span className="loading-dot" />
          </span>
        </span>
      ) : (
        <span>
          {hasRefreshed ? (
            <>
              <span style={{ color: '#10b981', fontWeight: 600 }}>{refreshedText}</span>
              {defaultStatusText ? ` • ${defaultStatusText}` : ''}
            </>
          ) : (
            defaultStatusText
          )}
        </span>
      )}
    </p>
  );
};

const RefreshHeaderPanel = ({
  title,
  defaultStatusText = 'Roles, and status for tables',
  loadingText = 'Skeleton loading',
  refreshedText = 'Refreshed just now',
  buttonLabel = 'Refresh',
  onRefresh,
  isLoading: externalIsLoading,
  extraActions,
  style = {}
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [hasRefreshed, setHasRefreshed] = useState(false);

  const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalLoading;

  const handleRefresh = async () => {
    if (isLoading) return;
    setInternalLoading(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      setHasRefreshed(true);
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <div
      className="panel-header"
      style={{
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        ...style
      }}
    >
      <div>
        {title && <h2 className="panel-title" style={{ fontSize: '1.4rem', margin: 0, color: 'var(--admin-text-main)' }}>{title}</h2>}
        <RefreshStatusSubtitle
          isLoading={isLoading}
          defaultStatusText={defaultStatusText}
          loadingText={loadingText}
          refreshedText={refreshedText}
          hasRefreshed={hasRefreshed}
        />
      </div>

      <div className="panel-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <RefreshButton
          onRefresh={handleRefresh}
          isLoading={isLoading}
          buttonLabel={buttonLabel}
        />
        {extraActions}
      </div>
    </div>
  );
};

export default RefreshHeaderPanel;
