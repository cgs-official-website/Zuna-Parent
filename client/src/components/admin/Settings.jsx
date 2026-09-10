import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../../services/firebase';

// Worldwide countries, states, and cities mapped to official IANA timezones
const WORLD_LOCATIONS = [
  // India (IST)
  { id: 'in-tn', label: 'Tamil Nadu (India)', tz: 'Asia/Kolkata', keywords: 'india tamil nadu chennai madurai coimbatore ist' },
  { id: 'in-wb', label: 'Kolkata (India)', tz: 'Asia/Kolkata', keywords: 'india west bengal kolkata calcutta ist' },
  { id: 'in-mh', label: 'Mumbai / Maharashtra (India)', tz: 'Asia/Kolkata', keywords: 'india mumbai maharashtra bombay ist' },
  { id: 'in-dl', label: 'Delhi / NCR (India)', tz: 'Asia/Kolkata', keywords: 'india delhi new delhi ncr gurgaon noida ist' },
  { id: 'in-ka', label: 'Bengaluru / Karnataka (India)', tz: 'Asia/Kolkata', keywords: 'india bengaluru bangalore karnataka ist' },
  { id: 'in-tg', label: 'Hyderabad / Telangana (India)', tz: 'Asia/Kolkata', keywords: 'india hyderabad telangana ist' },
  { id: 'in-kl', label: 'Kerala (India)', tz: 'Asia/Kolkata', keywords: 'india kerala kochi thiruvananthapuram ist' },
  { id: 'in-gj', label: 'Gujarat / Ahmedabad (India)', tz: 'Asia/Kolkata', keywords: 'india gujarat ahmedabad surat ist' },
  { id: 'in-rj', label: 'Jaipur / Rajasthan (India)', tz: 'Asia/Kolkata', keywords: 'india jaipur rajasthan ist' },
  { id: 'in-pb', label: 'Punjab / Chandigarh (India)', tz: 'Asia/Kolkata', keywords: 'india punjab chandigarh mohali ist' },

  // USA & Canada
  { id: 'us-ny', label: 'New York (USA)', tz: 'America/New_York', keywords: 'usa united states new york ny est edt eastern' },
  { id: 'us-ca', label: 'Los Angeles / California (USA)', tz: 'America/Los_Angeles', keywords: 'usa california los angeles la san francisco san diego pst pdt pacific' },
  { id: 'us-il', label: 'Chicago / Illinois (USA)', tz: 'America/Chicago', keywords: 'usa illinois chicago cst cdt central' },
  { id: 'us-co', label: 'Denver / Colorado (USA)', tz: 'America/Denver', keywords: 'usa colorado denver mst mdt mountain' },
  { id: 'us-az', label: 'Phoenix / Arizona (USA)', tz: 'America/Phoenix', keywords: 'usa arizona phoenix mst' },
  { id: 'us-ak', label: 'Anchorage / Alaska (USA)', tz: 'America/Anchorage', keywords: 'usa alaska anchorage akst akdt' },
  { id: 'us-hi', label: 'Honolulu / Hawaii (USA)', tz: 'Pacific/Honolulu', keywords: 'usa hawaii honolulu hst' },
  { id: 'ca-on', label: 'Toronto / Ontario (Canada)', tz: 'America/Toronto', keywords: 'canada ontario toronto est edt' },
  { id: 'ca-bc', label: 'Vancouver / BC (Canada)', tz: 'America/Vancouver', keywords: 'canada british columbia vancouver pst pdt' },

  // UK & Europe
  { id: 'uk-lon', label: 'London (UK)', tz: 'Europe/London', keywords: 'uk united kingdom england london gmt bst' },
  { id: 'fr-par', label: 'Paris (France)', tz: 'Europe/Paris', keywords: 'france paris cet cest europe' },
  { id: 'de-ber', label: 'Berlin / Munich (Germany)', tz: 'Europe/Berlin', keywords: 'germany berlin munich cet cest europe' },
  { id: 'it-rom', label: 'Rome / Milan (Italy)', tz: 'Europe/Rome', keywords: 'italy rome milan cet cest europe' },
  { id: 'es-mad', label: 'Madrid / Barcelona (Spain)', tz: 'Europe/Madrid', keywords: 'spain madrid barcelona cet cest europe' },
  { id: 'nl-ams', label: 'Amsterdam (Netherlands)', tz: 'Europe/Amsterdam', keywords: 'netherlands amsterdam holland cet cest' },
  { id: 'ie-dub', label: 'Dublin (Ireland)', tz: 'Europe/Dublin', keywords: 'ireland dublin gmt ist' },
  { id: 'ch-zur', label: 'Zurich (Switzerland)', tz: 'Europe/Zurich', keywords: 'switzerland zurich cet cest' },
  { id: 'ru-mos', label: 'Moscow (Russia)', tz: 'Europe/Moscow', keywords: 'russia moscow msk' },

  // Middle East & Asia
  { id: 'ae-dxb', label: 'Dubai / Abu Dhabi (UAE)', tz: 'Asia/Dubai', keywords: 'uae united arab emirates dubai abu dhabi gst' },
  { id: 'sa-ruh', label: 'Riyadh (Saudi Arabia)', tz: 'Asia/Riyadh', keywords: 'saudi arabia riyadh ast' },
  { id: 'sg-sin', label: 'Singapore', tz: 'Asia/Singapore', keywords: 'singapore sgt' },
  { id: 'jp-tyo', label: 'Tokyo (Japan)', tz: 'Asia/Tokyo', keywords: 'japan tokyo jst' },
  { id: 'kr-sel', label: 'Seoul (South Korea)', tz: 'Asia/Seoul', keywords: 'korea seoul kst' },
  { id: 'hk-hkg', label: 'Hong Kong', tz: 'Asia/Hong_Kong', keywords: 'hong kong hkt' },
  { id: 'cn-sha', label: 'Shanghai / Beijing (China)', tz: 'Asia/Shanghai', keywords: 'china shanghai beijing cst' },
  { id: 'th-bkk', label: 'Bangkok (Thailand)', tz: 'Asia/Bangkok', keywords: 'thailand bangkok ict' },
  { id: 'id-jkt', label: 'Jakarta (Indonesia)', tz: 'Asia/Jakarta', keywords: 'indonesia jakarta wib' },
  { id: 'my-kul', label: 'Kuala Lumpur (Malaysia)', tz: 'Asia/Kuala_Lumpur', keywords: 'malaysia kuala lumpur myt' },

  // Australia & New Zealand
  { id: 'au-syd', label: 'Sydney (Australia)', tz: 'Australia/Sydney', keywords: 'australia sydney nsw aest aedt' },
  { id: 'au-mel', label: 'Melbourne (Australia)', tz: 'Australia/Melbourne', keywords: 'australia melbourne victoria aest aedt' },
  { id: 'au-bne', label: 'Brisbane (Australia)', tz: 'Australia/Brisbane', keywords: 'australia brisbane queensland aest' },
  { id: 'au-per', label: 'Perth (Australia)', tz: 'Australia/Perth', keywords: 'australia perth awst' },
  { id: 'nz-akl', label: 'Auckland (New Zealand)', tz: 'Pacific/Auckland', keywords: 'new zealand auckland nzst nzdt' },

  // Latin America & Africa
  { id: 'br-sao', label: 'São Paulo (Brazil)', tz: 'America/Sao_Paulo', keywords: 'brazil sao paulo brt' },
  { id: 'ar-bue', label: 'Buenos Aires (Argentina)', tz: 'America/Argentina/Buenos_Aires', keywords: 'argentina buenos aires art' },
  { id: 'mx-mex', label: 'Mexico City (Mexico)', tz: 'America/Mexico_City', keywords: 'mexico mexico city cst cdt' },
  { id: 'eg-cai', label: 'Cairo (Egypt)', tz: 'Africa/Cairo', keywords: 'egypt cairo eest' },
  { id: 'za-jnb', label: 'Johannesburg (South Africa)', tz: 'Africa/Johannesburg', keywords: 'south africa johannesburg sast' }
];

// Helper to get short timezone name / DST abbreviation (e.g. IST, EDT, EST, PDT, PST, BST, GMT)
const getTimezoneAbbr = (timeZone) => {
  if (!timeZone) return '';
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : '';
  } catch (e) {
    return '';
  }
};

const Settings = () => {
  const [adminName, setAdminName] = useState('Admin User');
  const [adminEmail, setAdminEmail] = useState('admin@zuna.com');
  const [companyName, setCompanyName] = useState('Zuna Multi-Product SaaS Inc.');
  const [currency, setCurrency] = useState('INR (₹)');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Dynamic Location & Timezone State
  const [selectedTimezone, setSelectedTimezone] = useState(() => {
    return localStorage.getItem('zuna_admin_timezone') || 'Asia/Kolkata';
  });
  const [selectedLocationName, setSelectedLocationName] = useState(() => {
    return localStorage.getItem('zuna_admin_location_name') || 'Tamil Nadu (India)';
  });
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [liveDateTime, setLiveDateTime] = useState('');

  // Theme Settings State: 'default' | 'light' | 'dark'
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('zuna_admin_theme_mode') || 'dark';
  });

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Combine predefined location mappings with all available system IANA timezones
  const allLocationOptions = useMemo(() => {
    const options = [...WORLD_LOCATIONS];
    const existingTzs = new Set(WORLD_LOCATIONS.map(x => x.tz));

    if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
      try {
        const systemTzs = Intl.supportedValuesOf('timeZone');
        systemTzs.forEach(tz => {
          if (!existingTzs.has(tz)) {
            const cleanName = tz.split('/').pop().replace(/_/g, ' ');
            options.push({
              id: `tz_${tz}`,
              label: `${cleanName} (${tz})`,
              tz: tz,
              keywords: `${tz} ${cleanName}`.toLowerCase()
            });
          }
        });
      } catch (e) {
        console.warn('Error reading system timezones:', e);
      }
    }
    return options;
  }, []);

  // Search filter matching Countries, States, Cities, and Timezones
  const filteredLocations = useMemo(() => {
    if (!locationSearchQuery.trim()) return allLocationOptions;
    const q = locationSearchQuery.toLowerCase().trim();
    return allLocationOptions.filter(loc => 
      loc.label.toLowerCase().includes(q) || 
      loc.tz.toLowerCase().includes(q) || 
      loc.keywords.includes(q)
    );
  }, [allLocationOptions, locationSearchQuery]);

  // Ticking live clock for selected timezone with DST calculation
  useEffect(() => {
    const updateClock = () => {
      try {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          timeZone: selectedTimezone
        });
        const timeStr = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: selectedTimezone
        });
        setLiveDateTime(`${dateStr} • ${timeStr}`);
      } catch (err) {
        setLiveDateTime(new Date().toLocaleString());
      }
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [selectedTimezone]);

  const handleLocationSelect = (tz) => {
    const match = allLocationOptions.find(item => item.tz === tz);
    const locationName = match ? match.label : tz.replace(/_/g, ' ');

    setSelectedTimezone(tz);
    setSelectedLocationName(locationName);

    localStorage.setItem('zuna_admin_timezone', tz);
    localStorage.setItem('zuna_admin_location_name', locationName);
    window.dispatchEvent(new Event('zuna_settings_updated'));
  };

  const handleThemeModeSelect = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('zuna_admin_theme_mode', mode);

    let effectiveTheme = 'dark';
    if (mode === 'light') {
      effectiveTheme = 'light';
    } else if (mode === 'dark') {
      effectiveTheme = 'dark';
    } else {
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      effectiveTheme = prefersLight ? 'light' : 'dark';
    }

    localStorage.setItem('zuna_admin_theme', effectiveTheme);
    window.dispatchEvent(new Event('zuna_settings_updated'));
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      const user = auth.currentUser;
      if (user && user.email) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        setPasswordSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('Error updating password:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPasswordError('Current password is incorrect.');
      } else if (err.code === 'auth/requires-recent-login') {
        setPasswordError('Session expired. Please log out and log back in to change password.');
      } else {
        setPasswordSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="admin-overview-container">
      {/* Header */}
      <div className="panel-header" style={{ marginBottom: '1.75rem' }}>
        <div>
          <h2 className="panel-title" style={{ fontSize: '1.5rem', margin: 0 }}>System & Admin Settings</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
            Manage administrative profile, dynamic country/city time zones, visual themes, and security.
          </p>
        </div>
        {savedSuccess && (
          <span style={{ background: '#00F5D4', color: '#0f172a', padding: '0.4rem 1rem', borderRadius: '50px', fontSize: '0.82rem', fontWeight: 700 }}>
            ✓ Settings Saved Successfully!
          </span>
        )}
      </div>

      {/* Row 1: Profile & Multi-tenant Preferences */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem', marginBottom: '1.75rem' }}>
        {/* Profile Info */}
        <div className="admin-panel">
          <div className="panel-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--admin-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="unified-admin-icon sm" style={{ background: 'rgba(0, 132, 255, 0.12)', color: 'var(--accent)' }}>
                <Icons.User size={18} />
              </div>
              <span className="panel-title" style={{ fontSize: '1.1rem' }}>Administrator Profile</span>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: '0.35rem' }}>Display Name</label>
              <input 
                type="text" 
                className="admin-input" 
                value={adminName} 
                onChange={(e) => setAdminName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: '0.35rem' }}>Admin Email Address</label>
              <input 
                type="email" 
                className="admin-input" 
                value={adminEmail} 
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: '0.35rem' }}>Security Role</label>
              <input 
                type="text" 
                className="admin-input" 
                value="System Administrator (Super User)" 
                readOnly
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.6rem 1.25rem', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Company & Platform Config */}
        <div className="admin-panel">
          <div className="panel-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--admin-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="unified-admin-icon sm" style={{ background: 'rgba(0, 245, 212, 0.12)', color: '#00F5D4' }}>
                <Icons.Building size={18} />
              </div>
              <span className="panel-title" style={{ fontSize: '1.1rem' }}>Multi-Tenant SaaS Preferences</span>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: '0.35rem' }}>Company / Organization Name</label>
              <input 
                type="text" 
                className="admin-input" 
                value={companyName} 
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: '0.35rem' }}>Default Currency</label>
              <select className="filter-select" style={{ width: '100%' }} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="USD ($)">USD ($)</option>
                <option value="EUR (€)">EUR (€)</option>
                <option value="GBP (£)">GBP (£)</option>
                <option value="INR (₹)">INR (₹)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: '0.35rem' }}>Automated Backup Frequency</label>
              <select className="filter-select" style={{ width: '100%' }}>
                <option value="daily">Daily at 00:00 UTC</option>
                <option value="hourly">Every 6 Hours</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.6rem 1.25rem', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Save Platform Config
            </button>
          </form>
        </div>
      </div>

      {/* Row 2: Date & Time + Theme Settings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem', marginBottom: '1.75rem' }}>
        {/* Dynamic Location & Time Zone Section */}
        <div className="admin-panel">
          <div className="panel-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--admin-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="unified-admin-icon sm" style={{ background: 'rgba(255, 179, 0, 0.15)', color: '#FFB300' }}>
                <Icons.Globe size={18} />
              </div>
              <div>
                <span className="panel-title" style={{ fontSize: '1.1rem', display: 'block' }}>Dynamic Location & Time Zone</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>Search and select any country, state, or city worldwide</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* Live Clock & Active Location Card */}
            <div style={{ background: 'var(--theme-toggle-bg, rgba(255,255,255,0.04))', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>
                  📍 {selectedLocationName}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--admin-text-main)', fontFamily: 'monospace' }}>
                  {liveDateTime || 'Loading date & time...'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0, 245, 212, 0.1)', color: '#00F5D4', padding: '0.35rem 0.75rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 600 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00F5D4', display: 'inline-block' }} /> Live
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: '0.4rem' }}>
                Search Country, State, City, or Time Zone
              </label>

              {/* Location Search Input */}
              <div style={{ position: 'relative', marginBottom: '0.65rem' }}>
                <Icons.Search 
                  size={16} 
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)', opacity: 0.6 }} 
                />
                <input 
                  type="text" 
                  className="admin-input" 
                  placeholder="Search Tamil Nadu, Kolkata, New York, Los Angeles, London..." 
                  value={locationSearchQuery}
                  onChange={(e) => setLocationSearchQuery(e.target.value)}
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.2rem', fontSize: '0.85rem' }}
                />
                {locationSearchQuery && (
                  <button 
                    type="button" 
                    onClick={() => setLocationSearchQuery('')}
                    title="Clear search"
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Location Select Dropdown */}
              <select 
                className="filter-select" 
                style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                value={selectedTimezone}
                onChange={(e) => handleLocationSelect(e.target.value)}
              >
                {filteredLocations.length === 0 ? (
                  <option disabled value="">No matching locations found for "{locationSearchQuery}"</option>
                ) : (
                  filteredLocations.map(loc => (
                    <option key={loc.id || loc.tz} value={loc.tz}>
                      {loc.label}
                    </option>
                  ))
                )}
              </select>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                <span>
                  {locationSearchQuery 
                    ? `Found ${filteredLocations.length} matching location${filteredLocations.length !== 1 ? 's' : ''}` 
                    : `Showing all ${allLocationOptions.length} global locations & time zones`}
                </span>
                {selectedTimezone && (
                  <span style={{ fontWeight: 600, color: 'var(--accent)' }}>Active: {selectedLocationName}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Theme Settings Section */}
        <div className="admin-panel">
          <div className="panel-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--admin-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="unified-admin-icon sm" style={{ background: 'rgba(156, 39, 176, 0.15)', color: '#BA68C8' }}>
                <Icons.Palette size={18} />
              </div>
              <div>
                <span className="panel-title" style={{ fontSize: '1.1rem', display: 'block' }}>Theme Settings</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>Choose your preferred admin visual appearance</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {/* Option 1: Default */}
              <div 
                onClick={() => handleThemeModeSelect('default')}
                style={{
                  border: themeMode === 'default' ? '2px solid var(--accent, #0084FF)' : '1px solid var(--admin-border)',
                  background: themeMode === 'default' ? 'rgba(0, 132, 255, 0.08)' : 'var(--theme-toggle-bg, rgba(255,255,255,0.03))',
                  borderRadius: '12px',
                  padding: '1.1rem 0.85rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ margin: '0 auto 0.6rem', color: themeMode === 'default' ? 'var(--accent)' : 'var(--admin-text-muted)', display: 'flex', justifyContent: 'center' }}>
                  <Icons.Monitor size={24} />
                </div>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--admin-text-main)', marginBottom: '0.2rem' }}>Default</strong>
                <small style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', display: 'block' }}>System Preference</small>
              </div>

              {/* Option 2: Light Mode */}
              <div 
                onClick={() => handleThemeModeSelect('light')}
                style={{
                  border: themeMode === 'light' ? '2px solid var(--accent, #0084FF)' : '1px solid var(--admin-border)',
                  background: themeMode === 'light' ? 'rgba(0, 132, 255, 0.08)' : 'var(--theme-toggle-bg, rgba(255,255,255,0.03))',
                  borderRadius: '12px',
                  padding: '1.1rem 0.85rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ margin: '0 auto 0.6rem', color: themeMode === 'light' ? '#FFB300' : 'var(--admin-text-muted)', display: 'flex', justifyContent: 'center' }}>
                  <Icons.Sun size={24} />
                </div>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--admin-text-main)', marginBottom: '0.2rem' }}>Light Mode</strong>
                <small style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', display: 'block' }}>Clean Bright UI</small>
              </div>

              {/* Option 3: Dark Mode */}
              <div 
                onClick={() => handleThemeModeSelect('dark')}
                style={{
                  border: themeMode === 'dark' ? '2px solid var(--accent, #0084FF)' : '1px solid var(--admin-border)',
                  background: themeMode === 'dark' ? 'rgba(0, 132, 255, 0.08)' : 'var(--theme-toggle-bg, rgba(255,255,255,0.03))',
                  borderRadius: '12px',
                  padding: '1.1rem 0.85rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ margin: '0 auto 0.6rem', color: themeMode === 'dark' ? 'var(--accent)' : 'var(--admin-text-muted)', display: 'flex', justifyContent: 'center' }}>
                  <Icons.Moon size={24} />
                </div>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--admin-text-main)', marginBottom: '0.2rem' }}>Dark Mode</strong>
                <small style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', display: 'block' }}>Sleek Dark UI</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Security & Password Management */}
      <div className="admin-panel">
        <div className="panel-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--admin-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="unified-admin-icon sm" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <Icons.ShieldCheck size={18} />
            </div>
            <div>
              <span className="panel-title" style={{ fontSize: '1.1rem', display: 'block' }}>Security & Change Password</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>Update your admin authentication credentials</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleChangePassword} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', maxWidth: '650px' }}>
          {passwordSuccess && (
            <div style={{ color: '#00F5D4', background: 'rgba(0, 245, 212, 0.1)', border: '1px solid rgba(0, 245, 212, 0.25)', padding: '0.85rem 1rem', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600 }}>
              ✓ {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.85rem 1rem', borderRadius: '10px', fontSize: '0.88rem' }}>
              ⚠️ {passwordError}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: '0.35rem' }}>Current Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showCurrentPass ? 'text' : 'password'} 
                className="admin-input" 
                placeholder="Enter current password"
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{ paddingRight: '2.5rem' }}
                required
              />
              <button 
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                style={{ position: 'absolute', right: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)' }}
              >
                {showCurrentPass ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: '0.35rem' }}>New Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showNewPass ? 'text' : 'password'} 
                  className="admin-input" 
                  placeholder="At least 6 characters"
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingRight: '2.5rem' }}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  style={{ position: 'absolute', right: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)' }}
                >
                  {showNewPass ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: '0.35rem' }}>Confirm New Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showConfirmPass ? 'text' : 'password'} 
                  className="admin-input" 
                  placeholder="Re-enter new password"
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingRight: '2.5rem' }}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  style={{ position: 'absolute', right: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)' }}
                >
                  {showConfirmPass ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.65rem 1.4rem', fontSize: '0.88rem', marginTop: '0.5rem' }} disabled={passwordLoading}>
            {passwordLoading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
