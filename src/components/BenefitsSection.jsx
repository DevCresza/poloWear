import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Award, 
  Users, 
  Truck, 
  HeartHandshake 
} from 'lucide-react';

export default function BenefitsSection() {
  const benefits = [
    {
      icon: Award,
      title: "Marca Reconhecida",
      description: "25 anos de tradição e qualidade no mercado nacional",
      color: "bg-blue-50 text-blue-600"
    },
    {
      icon: Users,
      title: "Suporte Especializado",
      description: "Equipe dedicada para apoiar seu crescimento",
      color: "bg-green-50 text-green-600"
    },
    {
      icon: Truck,
      title: "Logística Eficiente",
      description: "Entregas rápidas e seguras em todo o país",
      color: "bg-purple-50 text-purple-600"
    },
    {
      icon: HeartHandshake,
      title: "Parceria Sólida",
      description: "Relacionamento duradouro e transparente",
      color: "bg-teal-50 text-teal-600"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Por que escolher a POLO Wear?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Oferecemos as melhores condições para o sucesso da sua loja. 
            Conheça os benefícios exclusivos da nossa rede.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardContent className="p-8">
                <div className={`w-16 h-16 rounded-2xl ${benefit.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <benefit.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}