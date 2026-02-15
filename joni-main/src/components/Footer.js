import React from "react";

const Footer = () => {
  return (
    <>
      <section className="mainfooter">
        <div className="custom-container">
          <div className="innerfooter">
            <div className="footerleft">
              <img src="/logo.svg" alt="logoimg" className="logoimg" />
              <h6 className="lefthead">
                The Smartest Platform for Multi-Agent AI Management
              </h6>
              <p className="leftpara">
                © 2026 Joni. All rights reserved. Joni built by Joni
              </p>
              <p className="leftpara">v1.2</p>
            </div>
            <div className="footerright">
              <div className="rightinner">
                <h6 className="innerhead">Product</h6>
                <a href="" className="innerlink">
                  Features
                </a>
                <a href="" className="innerlink">
                  Pricing
                </a>
                <a href="" className="innerlink">
                  Marketplace
                </a>
                <a href="" className="innerlink">
                  Documentation
                </a>
              </div>
              <div className="rightinner">
                <h6 className="innerhead">Company</h6>
                <a href="" className="innerlink">
                  About
                </a>
                <a href="" className="innerlink">
                  Blog
                </a>
                <a href="" className="innerlink">
                  Careers
                </a>
                <a href="" className="innerlink">
                  Contact
                </a>
              </div>
              <div className="rightinner">
                <h6 className="innerhead">Legal</h6>
                <a href="" className="innerlink">
                  Terms
                </a>
                <a href="" className="innerlink">
                  Privacy
                </a>
                <a href="" className="innerlink">
                  Security
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Footer;
