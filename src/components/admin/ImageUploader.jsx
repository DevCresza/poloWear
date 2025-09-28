import React, { useState } from 'react';
import { UploadFile } from '@/api/integrations';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ImageUploader({ imageUrl, onUploadComplete, onRemove }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    console.log('🔄 ImageUploader: handleFileChange chamado');
    const file = e.target.files[0];
    console.log('📁 ImageUploader: Arquivo selecionado:', file);

    if (!file) {
      console.log('❌ ImageUploader: Nenhum arquivo selecionado, saindo...');
      return;
    }

    setUploading(true);
    try {
      console.log('🔄 ImageUploader: Iniciando upload...', file.name);
      const result = await UploadFile(file, { folder: 'produtos' });
      console.log('✅ ImageUploader: Upload completo:', result);

      if (result && result.url) {
        console.log('✅ ImageUploader: URL encontrada:', result.url);
        try {
          console.log('🔄 ImageUploader: Chamando onUploadComplete...');
          onUploadComplete(result.url);
          console.log('✅ ImageUploader: onUploadComplete executado com sucesso');
        } catch (callbackError) {
          console.error('❌ ImageUploader: Erro no onUploadComplete:', callbackError);
          throw callbackError;
        }
      } else {
        throw new Error('URL não encontrada na resposta');
      }
    } catch (error) {
      console.error("❌ ImageUploader: Upload failed:", error);
      // Removido alert para não interferir na navegação
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative aspect-square rounded-2xl bg-slate-100 shadow-[inset_5px_5px_10px_#b8b9be,inset_-5px_-5px_10px_#ffffff] p-2 flex items-center justify-center">
      {imageUrl ? (
        <>
          <img src={imageUrl} alt="Preview do Produto" className="w-full h-full object-cover rounded-lg" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={onRemove}
            className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md"
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : uploading ? (
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      ) : (
        <label className="cursor-pointer text-center space-y-2">
          <Upload className="mx-auto h-8 w-8 text-slate-500" />
          <span className="text-sm font-medium text-slate-600">Adicionar Foto</span>
          <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
        </label>
      )}
    </div>
  );
}