import React, { useRef } from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import BenefitsSection from '../components/BenefitsSection';
import ProductGallery from '../components/ProductGallery';
import ContactForm from '../components/ContactForm';
import Footer from '../components/Footer';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Home() {
  const contactRef = useRef(null);

  // Configurar título e descrição da página inicial
  usePageTitle(
    'Plataforma B2B de Moda e Confecções',
    'POLO B2B é a plataforma líder para negócios B2B no setor de moda e confecções. Conecte fornecedores e multimarcas com eficiência e qualidade.'
  );

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection onScrollToContact={scrollToContact} />
      <div id="beneficios">
        <BenefitsSection />
      </div>
      <div id="produtos">
        <ProductGallery />
      </div>
      <div id="contato" ref={contactRef}>
        <ContactForm />
      </div>
      <Footer />
    </div>
  );
}