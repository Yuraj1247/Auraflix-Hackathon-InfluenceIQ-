import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Analysis from './components/Analysis';
import About from './components/About';
import Contact from './components/Contact';
import FAQ from './components/FAQ';
import Footer from './components/Footer';

gsap.registerPlugin(ScrollTrigger);

function App() {
  useGSAP(() => {
    gsap.utils.toArray('.section').forEach(section => {
      gsap.from(section, {
        opacity: 0,
        y: 50,
        duration: 1,
        scrollTrigger: { trigger: section, start: 'top 85%' }
      });
    });
  });

  return (
    <>
      <Navbar />
      <Home />
      <Analysis />
      <About />
      <Contact />
      <FAQ />
      <Footer />
    </>
  );
}

export default App;