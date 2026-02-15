'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';

const Header = () => {
  const { user, authLoading, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <>
      <section className="main-navbar">
        <div className="custom-container">
          <nav className="navbar navbar-expand-lg">
            <div className="container-fluid p-0">
              <Link className="navbar-brand" href="/"><img src="/logo.svg" alt="img" className="img-fluid" /></Link>
              <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2.96289 3.70386H14.8147" stroke="#DAD9D9" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2.96289 8.88867H14.8147" stroke="#DAD9D9" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2.96289 14.074H14.8147" stroke="#DAD9D9" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                  <li className="nav-item">
                    <a className="nav-link active" aria-current="page" href="#">Home</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#">Features</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#">Architecture</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#">Marketplace</a>
                  </li>
                </ul>
                {!authLoading && (
                  user ? (
                    <div className="navbar-auth navbar-auth--logged-in">
                      <span className="navbar-username">{user.username}</span>
                      <button type="button" className="btn-common btn-common--outline" onClick={logout}>
                        Log out
                      </button>
                    </div>
                  ) : (
                    <div className="navbar-auth">
                      <button type="button" className="nav-link navbar-auth-link" onClick={() => setAuthModalOpen(true)}>
                        Log In
                      </button>
                      <button type="button" className="btn-common" onClick={() => setAuthModalOpen(true)}>
                        <span className="btn-shine" /> Sign up
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          </nav>
        </div>
      </section>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />
    </>
  );
};

export default Header;
