import React, { useState } from 'react';
import { UploadFile } from '@/api/integrations';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageCropModal from '@/components/ui/image-crop-modal';

export default function ImageUploader({ imageUrl, onUploadComplete, onRemove, label }) {
  const [uploading, setUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    // Criar URL temporária para preview
    const previewUrl = URL.createObjectURL(file);
    setTempImageUrl(previewUrl);
    setShowCropModal(true);
  };

  const handleCropComplete = async (croppedImageUrl, croppedImageBlob) => {
    setUploading(true);
    setShowCropModal(false);

    try {
      // Criar um arquivo a partir do blob
      const croppedFile = new File([croppedImageBlob], 'produto.jpg', { type: 'image/jpeg' });

      const result = await UploadFile(croppedFile, { folder: 'produtos' });

      if (result && result.url) {
        try {
          onUploadComplete(result.url);
        } catch (callbackError) {
          throw callbackError;
        }
      } else {
        throw new Error('URL não encontrada na resposta');
      }
    } catch (error) {
      // Removido alert para não interferir na navegação
    } finally {
      setUploading(false);
      // Limpar URL temporária
      if (tempImageUrl) {
        URL.revokeObjectURL(tempImageUrl);
        setTempImageUrl(null);
      }
    }
  };

  const handleCloseCropModal = () => {
    setShowCropModal(false);
    // Limpar URL temporária
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl(null);
    }
  };

  return (
    <>
      <div className="space-y-2">
        {label && (
          <div className="text-sm font-medium text-gray-700">{label}</div>
        )}
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
      </div>

      <ImageCropModal
        open={showCropModal}
        onClose={handleCloseCropModal}
        imageSrc={tempImageUrl}
        onCropComplete={handleCropComplete}
      />
    </>
  );
}