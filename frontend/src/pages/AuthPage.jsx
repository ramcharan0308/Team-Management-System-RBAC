import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { ShieldCheck, ArrowRight, Mail, Lock, User as UserIcon } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function ThreeBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 7.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Geometry: Integrated 3D Hero Artwork (1.4 radius, 0.38 tube)
    const geometry = new THREE.TorusKnotGeometry(1.4, 0.38, 128, 32);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x2563eb,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.15,
      roughness: 0.25,
      metalness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      wireframe: true,
    });
    const knot = new THREE.Mesh(geometry, material);
    
    // Integrated position (1.2, -0.25) allowing ~30% overlap behind the right edge of the text area
    knot.position.set(1.2, -0.25, 0);
    knot.rotation.set(0.4, 0.6, 0.2);
    scene.add(knot);

    // Particle Field
    const particlesCount = 160;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 14;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.028,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    let animationFrameId;
    let time = 0;
    const animate = () => {
      time += 0.012;
      knot.rotation.x += 0.0016;
      knot.rotation.y += 0.0028;
      knot.position.y = -0.25 + Math.sin(time) * 0.09; // Smooth floating motion integrated into background
      particles.rotation.y -= 0.0004;
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />;
}

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };
      const r = await api.post(endpoint, payload);
      login(r.data.user, r.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#090d16', color: '#fff', overflow: 'hidden', flexWrap: 'wrap' }}>
      
      {/* LEFT COLUMN: 60% Width Integrated Hero Section */}
      <div style={{ flex: '1.5 1 60%', minWidth: '340px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '72px 72px', overflow: 'hidden', background: 'radial-gradient(ellipse at top left, #1e1b4b 0%, #090d16 75%)' }}>
        
        {/* Soft Radial Blue Glow centered behind 3D Mesh Artwork */}
        <div style={{ position: 'absolute', right: '15%', top: '50%', transform: 'translateY(-50%)', width: '520px', height: '520px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37, 99, 235, 0.22) 0%, rgba(6, 182, 212, 0.05) 50%, transparent 75%)', pointerEvents: 'none', zIndex: 1 }} />

        <ThreeBackground />
        
        {/* Logo Positioned 56px from top */}
        <div style={{ position: 'absolute', top: '56px', left: '72px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #2563eb, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)' }}>
            <ShieldCheck size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.3px', color: '#ffffff' }}>Team Management System</div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8', letterSpacing: '0.5px' }}>Role-Based Access Control</div>
          </div>
        </div>

        {/* Hero Content Block */}
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '520px', marginTop: '54px' }}>
          <h1 style={{ fontSize: '46px', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-1px', marginBottom: '18px', background: 'linear-gradient(to right, #ffffff 40%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', whiteSpace: 'nowrap' }}>
            Team Management
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(148, 163, 184, 0.9)', lineHeight: 1.65, fontWeight: 400, maxWidth: '440px' }}>
            A secure RBAC platform for managing teams, permissions, and collaborative workflows.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: 40% Width Glassmorphic Authentication Card */}
      <div style={{ flex: '1 1 40%', minWidth: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', background: '#0f172a', borderLeft: '1px solid rgba(255, 255, 255, 0.08)', position: 'relative', zIndex: 20 }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          style={{ width: '100%', maxWidth: '380px' }}
        >
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '6px' }}>
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.5, fontWeight: 400 }}>
              {mode === 'login' ? 'Sign in to manage your teams, users and permissions.' : 'Start managing teams and permissions with granular controls.'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '13px', marginBottom: '20px', fontWeight: 500 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>FULL NAME</label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                    placeholder="Jane Smith"
                    required
                    style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '10px', background: '#1e293b', border: '1px solid #334155', color: '#ffffff', fontSize: '14px', transition: 'border-color 0.2s', fontWeight: 500 }}
                    onFocus={e => e.target.style.borderColor = '#38bdf8'}
                    onBlur={e => e.target.style.borderColor = '#334155'}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>EMAIL ADDRESS</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  placeholder="jane@company.com"
                  required
                  style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '10px', background: '#1e293b', border: '1px solid #334155', color: '#ffffff', fontSize: '14px', transition: 'border-color 0.2s', fontWeight: 500 }}
                  onFocus={e => e.target.style.borderColor = '#38bdf8'}
                  onBlur={e => e.target.style.borderColor = '#334155'}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="password"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '10px', background: '#1e293b', border: '1px solid #334155', color: '#ffffff', fontSize: '14px', transition: 'border-color 0.2s', fontWeight: 500 }}
                  onFocus={e => e.target.style.borderColor = '#38bdf8'}
                  onBlur={e => e.target.style.borderColor = '#334155'}
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)', marginTop: '8px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight size={16} />}
            </motion.button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '13px', color: '#94a3b8', fontWeight: 400 }}>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <span
              style={{ color: '#38bdf8', cursor: 'pointer', marginLeft: '6px', fontWeight: 600 }}
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </span>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
