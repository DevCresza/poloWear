import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreVertical, User, MessageCircle, DollarSign, Eye, Edit, UserCheck, CheckCircle, Archive } from 'lucide-react';

export default function ContactCard({
  contact,
  onViewDetails,
  onSendWhatsapp,
  onStatusChange,
  onCreateUser,
  onArchive,
  getStatusIcon
}) {
  const StatusIcon = getStatusIcon(contact.status);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{contact.nome?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-800">{contact.nome}</p>
              <p className="text-sm text-gray-500">{contact.empresa}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(contact)}>
                <Eye className="mr-2 h-4 w-4" />
                <span>Ver Detalhes</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSendWhatsapp(contact)}>
                <MessageCircle className="mr-2 h-4 w-4 text-green-500" />
                <span>Enviar WhatsApp</span>
              </DropdownMenuItem>

              {contact.status === 'negociacao' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onCreateUser(contact)} className="bg-green-50 text-green-700">
                    <UserCheck className="mr-2 h-4 w-4" />
                    <span>Liberar Acesso</span>
                  </DropdownMenuItem>
                </>
              )}

              {(contact.status === 'convertido' || contact.status === 'cancelado') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onArchive(contact)} className="bg-orange-50 text-orange-700">
                    <Archive className="mr-2 h-4 w-4" />
                    <span>Arquivar Lead</span>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onStatusChange(contact.id, 'novo')}>
                <span>Marcar como Novo</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(contact.id, 'em_contato')}>
                <span>Marcar como Em Contato</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(contact.id, 'negociacao')}>
                <span>Marcar como Negociação</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(contact.id, 'convertido')}>
                <span className="text-green-600">Marcar como Convertido</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(contact.id, 'cancelado')}>
                <span className="text-red-600">Marcar como Cancelado</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <StatusIcon className="w-4 h-4" />
            <span>{contact.status.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span>{contact.faixa_faturamento}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}