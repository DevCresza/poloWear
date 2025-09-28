import React from 'react';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-gray-900">
              POLO <span className="text-blue-600">B2B</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#beneficios" className="text-gray-600 hover:text-blue-600 transition-colors">
              Benefícios
            </a>
            <a href="#produtos" className="text-gray-600 hover:text-blue-600 transition-colors">
              Produtos
            </a>
            <a href="#contato" className="text-gray-600 hover:text-blue-600 transition-colors">
              Contato
            </a>
          </nav>

          {/* Login Button */}
          <div className="flex items-center">
            <Link to={createPageUrl('Login')}>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                <User className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Cliente</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}