import { useState } from 'react';

function Navbar() {
  const [isActive, setIsActive] = useState(false);

  const toggleMenu = () => setIsActive(!isActive);

  return (
    <nav className="navbar">
      <div className="logo">InfluenceIQ</div>
      <div className="hamburger" onClick={toggleMenu}>☰</div>
      <div className={`nav-links ${isActive ? 'active' : ''}`}>
        <a href="#home" onClick={toggleMenu}>Home</a>
        <a href="#analysis" onClick={toggleMenu}>Analysis</a>
        <a href="#about" onClick={toggleMenu}>About Us</a>
        <a href="#contact" onClick={toggleMenu}>Contact Us</a>
        <a href="#faq" onClick={toggleMenu}>FAQ</a>
      </div>
    </nav>
  );
}

export default Navbar;