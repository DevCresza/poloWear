
import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function ProductGallery() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Coleções em Destaque
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Produtos que conquistam clientes e garantem vendas excepcionais
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Product Image */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl transform -rotate-2 scale-105 opacity-10" />
            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/2bd68251c_CapturadeTela2025-09-01as141614.png"
                alt="Produto POLO Wear"
                className="w-full h-96 object-cover"
              />
              <div className="absolute top-6 left-6">
                <Badge className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold">
                  Mais Vendido
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Product Info */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-gray-900">
                Qualidade Premium
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Nossas peças são desenvolvidas com os melhores materiais e 
                tecnologia de ponta, garantindo conforto e durabilidade 
                incomparáveis.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-2xl font-bold text-blue-600 mb-2">100%</div>
                <div className="text-sm text-gray-600">Algodão Premium</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-2xl font-bold text-green-600 mb-2">30+</div>
                <div className="text-sm text-gray-600">Cores Disponíveis</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-2xl font-bold text-purple-600 mb-2">P-GG</div>
                <div className="text-sm text-gray-600">Tamanhos</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-2xl font-bold text-orange-600 mb-2">4.9★</div>
                <div className="text-sm text-gray-600">Avaliação</div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-2">
                Coleções Disponíveis:
              </h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-white">Básica</Badge>
                <Badge variant="outline" className="bg-white">Esportiva</Badge>
                <Badge variant="outline" className="bg-white">Casual</Badge>
                <Badge variant="outline" className="bg-white">Social</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
