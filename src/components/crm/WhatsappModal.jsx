import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WhatsappTemplate } from '@/api/entities';
import { MessageSquare, Send, BookOpen } from 'lucide-react';

export default function WhatsappModal({ contacts, onClose }) {
  const [message, setMessage] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const contact = contacts[0]; // Usando o primeiro contato para personalização

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const result = await WhatsappTemplate.find({ filters: { ativo: true } });
        setTemplates(result.success ? result.data : []);
      } catch (error) {
        console.error("Erro ao carregar templates de WhatsApp:", error);
        setTemplates([]);
      }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      let personalizedMessage = selectedTemplate.mensagem;
      if (contact) {
        personalizedMessage = personalizedMessage.replace(/{{nome}}/g, contact.nome || '');
        personalizedMessage = personalizedMessage.replace(/{{empresa}}/g, contact.empresa || '');
      }
      setMessage(personalizedMessage);
    }
  }, [selectedTemplate, contact]);

  const handleSend = () => {
    const encodedMessage = encodeURIComponent(message);
    contacts.forEach(c => {
      const phone = c.telefone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/55${phone}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    });
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-green-600" />
            Enviar Mensagem via WhatsApp
          </DialogTitle>
          <DialogDescription>
            A mensagem será aberta no WhatsApp para cada um dos {contacts.length} contatos selecionados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Usar Template (Opcional)
            </label>
            <Select onValueChange={value => setSelectedTemplate(templates.find(t => t.id === value))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.nome} - {template.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem aqui... Use {{nome}} para personalizar com o nome do contato."
            rows={8}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSend} disabled={!message} className="bg-green-600 hover:bg-green-700">
            <Send className="w-4 h-4 mr-2" />
            Enviar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}