import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import ProductCard from './ProductCard';
import TicketRaiseForm from './TicketRaiseForm';
import { productsService } from '../../services/productsService';
import { demoService } from '../../services/demoService';

function LandingPage() {
  const [products, setProducts] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Modals state
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  
  // Selected product for support ticket
  const [selectedTicketProduct, setSelectedTicketProduct] = useState({ id: '', name: '' });

  // Demo Form State
  const [demoForm, setDemoForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    product: '',
    message: ''
  });
  const [demoSuccess, setDemoSuccess] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState(false);

  // Fetch products from Firestore
  const fetchProducts = async () => {
    try {
      const data = await productsService.getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const timer = setTimeout(() => {
      const reveals = document.querySelectorAll('.reveal:not(.active)');
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });

      reveals.forEach(el => revealObserver.observe(el));
      
      return () => {
        reveals.forEach(el => revealObserver.unobserve(el));
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [products]); // Re-run when products load so new cards get observed

  // Sticky Header logic
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Demo Form Submit
  const handleDemoSubmit = async (e) => {
    e.preventDefault();
    setDemoSubmitting(true);
    try {
      await demoService.addDemoRequest(demoForm);
      setDemoSuccess(true);
    } catch (err) {
      console.error('Error submitting demo request:', err);
    } finally {
      setDemoSubmitting(false);
    }
  };

  const openDemoModal = (productName = '') => {
    setDemoForm(prev => ({ ...prev, product: productName }));
    setIsDemoModalOpen(true);
    setDemoSuccess(false);
  };

  const openTicketModal = (productId = '', productName = '') => {
    setSelectedTicketProduct({ id: productId, name: productName });
    setIsTicketModalOpen(true);
  };

  return (
    <div className="landing-layout">
      {/* Sticky Navigation Bar */}
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link to="/" className="logo">
            <img src="/Zuna_HRMS_Logo_Navy.png" alt="Zuna Logo" className="logo-img" />
            <span className="logo-text">Zuna</span>
          </Link>
          
          <button 
            className={`nav-toggle ${isMobileMenuOpen ? 'active' : ''}`} 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <ul className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
            <li><a href="#products" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Products</a></li>
            <li><a href="#solutions" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Solutions</a></li>
            <li><a href="#about" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>About</a></li>
            <li><a href="#contact" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Contact</a></li>
            <li className="mobile-cta-only">
              <button onClick={() => { setIsMobileMenuOpen(false); openDemoModal(); }} className="btn btn-primary">Request Demo</button>
            </li>
          </ul>

          <div className="nav-cta">
            <button onClick={() => openTicketModal()} className="btn btn-secondary" style={{ marginRight: '1rem', padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
              Raise Ticket
            </button>
            <button onClick={() => openDemoModal()} className="btn btn-primary">Request Demo</button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Backdrop Blur Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay active" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="glow-blob blob-1"></div>
        <div className="glow-blob blob-2"></div>
        
        <div className="hero-container">
          <div className="hero-content reveal">
            <div className="hero-tagline">
              <Icons.Cpu size={16} style={{ strokeWidth: 2.5 }} />
              Enterprise-Grade Platform
            </div>
            <h1 className="hero-title">Powering Businesses with <span>Smart Software</span> Solutions</h1>
            <p className="hero-subtitle">Zuna provides comprehensive management systems for Education, Hospitality, HR, and more - all in one unified place.</p>
            <div className="hero-ctas">
              <button onClick={() => openDemoModal()} className="btn btn-primary">Request a Demo</button>
              <a href="#products" className="btn btn-secondary">Explore Products</a>
            </div>
          </div>
          <div className="hero-visual reveal">
            <div className="hero-mockup-wrapper">
              <div className="hero-bg-glow"></div>
              <div className="floating-logo-canvas">
                <img src="/Zuna_HRMS_Logo_Navy.png" alt="Zuna Geometric Motif" className="hero-logo-motif" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By / Social Proof */}
      <section className="trusted-by">
        <div className="trusted-container">
          <h3 className="trusted-title">Trusted by industry-leading enterprises worldwide</h3>
          <div className="trusted-marquee">
            <div className="trusted-marquee-track">
              <span className="trusted-logo">EduTech Global</span>
              <span className="trusted-logo">HR Solutions Inc.</span>
              <span className="trusted-logo">DineSync Group</span>
              <span className="trusted-logo">SchoolGrid</span>
              <span className="trusted-logo">EventPro Corp</span>
              <span className="trusted-logo">FinPay Systems</span>
              {/* Duplicate set for seamless infinite loop scroll */}
              <span className="trusted-logo">EduTech Global</span>
              <span className="trusted-logo">HR Solutions Inc.</span>
              <span className="trusted-logo">DineSync Group</span>
              <span className="trusted-logo">SchoolGrid</span>
              <span className="trusted-logo">EventPro Corp</span>
              <span className="trusted-logo">FinPay Systems</span>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="section" id="products">
        <div className="section-header reveal">
          <span className="section-badge">Our Products</span>
          <h2 className="section-title">Comprehensive Management Solutions</h2>
          <p className="section-subtitle">Discover our ecosystem of professional, high-performance software modules tailored to meet your industry's demands.</p>
        </div>
        
        <div className="products-grid">
          {products.map(prod => (
            <ProductCard 
              key={prod.id} 
              product={prod} 
              onOpenDemo={openDemoModal} 
              onOpenTicket={openTicketModal} 
            />
          ))}
          {products.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading products... (or no products available)
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Zuna Section */}
      <section className="section section-bg-alt" id="solutions">
        <div className="why-container">
          <div className="why-content reveal">
            <span className="section-badge">Solutions Engineered For Growth</span>
            <h2 className="section-title">Built for the Modern Enterprise</h2>
            <p className="section-subtitle" style={{ marginBottom: '2.5rem' }}>
              Zuna empowers organizations to scale operations, eliminate redundancies, and accelerate efficiency across multiple industrial and academic branches.
            </p>
            
            <div className="why-features">
              <div className="feature-item">
                <div className="feature-icon-wrapper">
                  <Icons.Layers size={24} style={{ color: 'var(--accent)' }} />
                </div>
                <h4 className="feature-title">All-in-One Platform</h4>
                <p className="feature-desc">No more juggling multiple vendors. Zuna provides all solutions under one subscription.</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon-wrapper">
                  <Icons.Sparkles size={24} style={{ color: 'var(--accent)' }} />
                </div>
                <h4 className="feature-title">Easy to Use</h4>
                <p className="feature-desc">Intuitive visual interfaces designed for speed with close-to-zero learning curve.</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon-wrapper">
                  <Icons.Shield size={24} style={{ color: 'var(--accent)' }} />
                </div>
                <h4 className="feature-title">Secure & Reliable</h4>
                <p className="feature-desc">Enterprise-grade encryption protecting your customer and organization databases 24/7.</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon-wrapper">
                  <Icons.PhoneCall size={24} style={{ color: 'var(--accent)' }} />
                </div>
                <h4 className="feature-title">24/7 Dedicated Support</h4>
                <p className="feature-desc">Our expert customer success managers are always available to assist your operations.</p>
              </div>
            </div>
          </div>
          
          <div className="why-visual reveal">
            <div className="why-visual-wrapper">
              <div className="why-mockup-ui">
                <div className="mock-header">
                  <div className="mock-logo">
                    <div className="mock-logo-dot"></div> Zuna Analytics
                  </div>
                  <div className="mock-window-buttons">
                    <span></span><span></span><span></span>
                  </div>
                </div>
                <div className="mock-body">
                  <div className="mock-sidebar">
                    <div className="mock-menu-item active"></div>
                    <div className="mock-menu-item"></div>
                    <div className="mock-menu-item"></div>
                    <div className="mock-menu-item"></div>
                  </div>
                  <div className="mock-content">
                    <div className="mock-stats">
                      <div className="mock-stat-card">
                        <div className="mock-stat-label">Active Users</div>
                        <div className="mock-stat-value">12.4k</div>
                      </div>
                      <div className="mock-stat-card">
                        <div className="mock-stat-label">Efficiency Gain</div>
                        <div className="mock-stat-value">+38.2%</div>
                      </div>
                    </div>
                    <div className="mock-chart">
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Operational Output</div>
                      <div className="mock-chart-bars">
                        <div className="mock-chart-bar" style={{ height: '30%' }}></div>
                        <div className="mock-chart-bar" style={{ height: '45%' }}></div>
                        <div className="mock-chart-bar" style={{ height: '38%' }}></div>
                        <div className="mock-chart-bar" style={{ height: '60%' }}></div>
                        <div className="mock-chart-bar" style={{ height: '75%' }}></div>
                        <div className="mock-chart-bar" style={{ height: '90%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section" id="about">
        <div className="section-header reveal">
          <span className="section-badge">Streamlined Setup</span>
          <h2 className="section-title">How Zuna Integrates Into Your Business</h2>
          <p className="section-subtitle">Get up and running in minutes with our guided integration path.</p>
        </div>
        
        <div className="steps-container reveal">
          <div className="steps-line"></div>
          
          <div className="step-card">
            <div className="step-number">1</div>
            <h3 className="step-title">Choose Your Solution</h3>
            <p className="step-desc">Select one or multiple management tools fitting your business model.</p>
          </div>
          
          <div className="step-card">
            <div className="step-number">2</div>
            <h3 className="step-title">Get Onboarded</h3>
            <p className="step-desc">Receive guided system configuration from our technical deployment team.</p>
          </div>
          
          <div className="step-card">
            <div className="step-number">3</div>
            <h3 className="step-title">Grow Your Business</h3>
            <p className="step-desc">Monitor operational efficiency and scale seamlessly with Zuna ERP analytics.</p>
          </div>
        </div>
      </section>

      {/* About Company Section */}
      <section className="section section-bg-alt" id="about-carrezza" style={{ padding: '7rem 2rem' }}>
        <div className="why-container" style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <div className="section-header reveal" style={{ marginBottom: '2rem' }}>
            <span className="section-badge">Behind the Technology</span>
            <h2 className="section-title">About Zuna & Carrezza Global Solutions</h2>
          </div>
          <div className="reveal" style={{ maxWidth: '800px', margin: '0 auto', fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-main)' }}>
            <p style={{ marginBottom: '1.5rem' }}>
              Zuna is a comprehensive enterprise software platform suite developed by <strong>Carrezza Global Solutions Pvt Ltd</strong>, a leading IT services company based in Erode, Tamil Nadu, India. Our team specializes in delivering enterprise-grade solutions for HR management, education, hospitality, retail, and more.
            </p>
            <p style={{ fontWeight: 600, color: 'var(--text-headings)', marginBottom: '1.5rem' }}>
              For corporate inquiries or partnership opportunities, visit:
            </p>
            <p>
              <a href="https://www.teamcarrezza.com" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ borderRadius: '50px', padding: '1rem 2.5rem', fontSize: '1.05rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                Visit Our Website
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="contact">
        <div className="cta-container reveal">
          <h2 className="cta-title">Ready to Elevate Your Operations?</h2>
          <p className="cta-desc">Get in touch with our enterprise team today for a tailored walkthrough of the Zuna software suite.</p>
          <div className="hero-actions" style={{ justifyContent: 'center', gap: '1.25rem', display: 'flex', flexWrap: 'wrap', marginTop: '2rem' }}>
            <button onClick={() => openDemoModal()} className="btn btn-primary btn-large">
              Request Live Demo <Icons.ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
            </button>
            <button onClick={() => openTicketModal()} className="btn btn-outline btn-large">
              Raise Support Ticket
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <img src="/Zuna_HRMS_Logo_Navy.png" alt="Zuna Logo" className="footer-logo-img" />
              <span className="footer-logo-text">Zuna</span>
            </Link>
            <p className="footer-tagline">Providing next-generation management software ERPs, CRMs, and billing tools built for scalability and performance.</p>
            <div className="footer-socials">
              <a href="https://in.linkedin.com/company/carrezza-global-solutions-pvt-ltd" target="_blank" rel="noreferrer" className="footer-social-link" aria-label="LinkedIn">
                <Icons.Linkedin size={20} />
              </a>
              <a href="https://www.instagram.com/teamcarrezza/" target="_blank" rel="noreferrer" className="footer-social-link" aria-label="Instagram">
                <Icons.Instagram size={20} />
              </a>
            </div>
          </div>

          <div className="footer-about-company">
            <h4 className="footer-links-title">About Company</h4>
            <p className="footer-company-name" style={{ fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>Carrezza Global Solutions Pvt Ltd</p>
            <p className="footer-company-desc" style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#94a3b8', marginBottom: '1rem' }}>
              Carrezza Global Solutions is a premier IT services & BPO solutions provider headquartered in Erode, Tamil Nadu. We specialize in enterprise software development, AI automation, cloud solutions, and digital transformation for global businesses.
            </p>
            <div className="footer-company-info" style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <Icons.MapPin size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '0.2rem' }} />
                <a 
                  href="https://www.google.com/maps/search/Carrezza+Global+Solutions,+Perundurai,+Erode,+Tamil+Nadu,+India" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="footer-location-link"
                  title="Open location in Google Maps"
                >
                  <span className="location-title">Carrezza Global Solutions, Perundurai, Erode, Tamil Nadu, India</span>
                  <span className="location-subtitle">(Near URC Bar, Perundurai)</span>
                </a>
              </p>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icons.Mail size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <a href="mailto:info@teamcarrezza.com" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>info@teamcarrezza.com</a>
              </p>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icons.Globe size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <a href="https://www.teamcarrezza.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>www.teamcarrezza.com</a>
              </p>
            </div>
          </div>

          <div>
            <h4 className="footer-links-title">Products</h4>
            <ul className="footer-links-list">
              {products.filter(p => p.status !== 'Upcoming').map(prod => (
                <li key={prod.id}>
                  <a href="#products" className="footer-link">{prod.name}</a>
                </li>
              ))}

              {products.filter(p => p.status === 'Upcoming').length > 0 && (
                <>
                  <li style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f59e0b', fontWeight: 700, display: 'block' }}>
                      Upcoming Products
                    </span>
                  </li>
                  {products.filter(p => p.status === 'Upcoming').map(prod => (
                    <li key={prod.id}>
                      <a href="#products" className="footer-link">{prod.name}</a>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </div>

          <div>
            <h4 className="footer-links-title">Company</h4>
            <ul className="footer-links-list">
              <li><a href="#about" className="footer-link">About Zuna</a></li>
              <li><a href="#" className="footer-link">Privacy Policy</a></li>
              <li><a href="#" className="footer-link">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-links-title">Support</h4>
            <ul className="footer-links-list">
              <li><button onClick={() => openTicketModal()} className="footer-link" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>Raise Support Ticket</button></li>
              <li><button onClick={() => openDemoModal()} className="footer-link" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>Request Demo</button></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom" style={{ flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
          <p style={{ margin: 0 }}>&copy; 2026 Carrezza Global Solutions Pvt Ltd. All Rights Reserved.</p>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
            Zuna is developed and powered by <a href="https://www.teamcarrezza.com" target="_blank" rel="noreferrer" className="footer-attribution-link">Carrezza Global Solutions</a> - Premier IT Services & Solutions Provider
          </p>
        </div>
      </footer>

      {/* Request Demo Modal */}
      {isDemoModalOpen && (
        <div className="modal open" onClick={() => setIsDemoModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsDemoModalOpen(false)}>&times;</button>
            
            {demoSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ width: '64px', height: '64px', background: 'rgba(0, 210, 196, 0.1)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-teal)', marginBottom: '1.5rem' }}>
                  <Icons.Check size={32} style={{ strokeWidth: 2.5 }} />
                </div>
                <h3 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>Thank You, {demoForm.name}!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem', maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>
                  Our enterprise solutions specialist will contact you at <strong>{demoForm.email}</strong> within the next 24 hours to schedule your personalized demo{demoForm.product ? ` of ${demoForm.product}` : ''}.
                </p>
                <button className="btn btn-primary" onClick={() => setIsDemoModalOpen(false)}>Close</button>
              </div>
            ) : (
              <>
                <h3 className="modal-title">Request a Live Demo</h3>
                <p className="modal-desc" style={{ marginBottom: '1.5rem' }}>See how Zuna's unified management software can power your operations.</p>
                
                <form onSubmit={handleDemoSubmit}>
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label htmlFor="demo-name" className="form-label">Full Name *</label>
                    <input 
                      type="text" 
                      id="demo-name" 
                      className="form-input" 
                      placeholder="William Butcher" 
                      value={demoForm.name}
                      onChange={(e) => setDemoForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label htmlFor="demo-email" className="form-label">Work Email *</label>
                    <input 
                      type="email" 
                      id="demo-email" 
                      className="form-input" 
                      placeholder="william@company.com" 
                      value={demoForm.email}
                      onChange={(e) => setDemoForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label htmlFor="demo-phone" className="form-label">Phone Number *</label>
                    <input 
                      type="tel" 
                      id="demo-phone" 
                      className="form-input" 
                      placeholder="e.g. +91 98765 43210" 
                      pattern="[0-9\s\+\-]{10,20}"
                      title="Phone number must be at least 10 digits and can include spaces, +, or -"
                      value={demoForm.phone}
                      onChange={(e) => setDemoForm(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label htmlFor="demo-company" className="form-label">Company Name *</label>
                    <input 
                      type="text" 
                      id="demo-company" 
                      className="form-input" 
                      placeholder="Acme Corp" 
                      value={demoForm.company}
                      onChange={(e) => setDemoForm(prev => ({ ...prev, company: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label htmlFor="demo-product" className="form-label">Primary Product of Interest *</label>
                    <select 
                      id="demo-product" 
                      className="form-select" 
                      value={demoForm.product}
                      onChange={(e) => setDemoForm(prev => ({ ...prev, product: e.target.value }))}
                      required
                    >
                      <option value="" disabled>Select a product...</option>
                      {products.map(prod => (
                        <option key={prod.id} value={prod.name}>{prod.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button type="submit" className="btn btn-primary modal-submit" style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem' }}>
                    Schedule Demo
                  </button>
                  
                  <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Or email us directly at <a href="mailto:info@teamcarrezza.com" style={{ color: 'var(--accent)', fontWeight: 600 }}>info@teamcarrezza.com</a>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Raise Ticket Modal */}
      {isTicketModalOpen && (
        <div className="modal open" onClick={() => setIsTicketModalOpen(false)}>
          <div className="modal-content ticket-form-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsTicketModalOpen(false)}>&times;</button>
            <TicketRaiseForm 
              products={products}
              initialProductId={selectedTicketProduct.id}
              initialProductName={selectedTicketProduct.name}
              onClose={() => setIsTicketModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
