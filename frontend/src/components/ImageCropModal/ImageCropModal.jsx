import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import "./ImageCropModal.css";

function criarImagem(url) {
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.addEventListener("load", () => resolve(imagem));
    imagem.addEventListener("error", (error) => reject(error));
    imagem.setAttribute("crossOrigin", "anonymous");
    imagem.src = url;
  });
}

async function gerarImagemCortada(imageSrc, pixelCrop) {
  const imagem = await criarImagem(imageSrc);
  const canvas = document.createElement("canvas");
  const contexto = canvas.getContext("2d");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  contexto.drawImage(
    imagem,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        const arquivo = new File([blob], `imagem-cortada-${Date.now()}.jpg`, {
          type: "image/jpeg"
        });

        resolve(arquivo);
      },
      "image/jpeg",
      0.92
    );
  });
}

function ImageCropModal({ imagem, onCancel, onConfirm, aspect = 4 / 3 }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaCortada, setAreaCortada] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setAreaCortada(croppedAreaPixels);
  }, []);

  async function confirmarCorte() {
    if (!areaCortada) return;

    try {
      setSalvando(true);

      const arquivoCortado = await gerarImagemCortada(imagem, areaCortada);

      onConfirm(arquivoCortado);
    } catch (error) {
      alert("Erro ao cortar imagem.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="crop-modal-overlay">
      <div className="crop-modal-card">
        <div className="crop-modal-header">
          <div>
            <h2>Ajustar imagem</h2>
            <p>Arraste a imagem e ajuste o zoom para enquadrar melhor.</p>
          </div>

          <button type="button" onClick={onCancel}>
            X
          </button>
        </div>

        <div className="crop-area">
          <Cropper
            image={imagem}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="crop-controls">
          <label>
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
        </div>

        <div className="crop-actions">
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={confirmarCorte}
            disabled={salvando}
          >
            {salvando ? "Salvando..." : "Usar imagem"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropModal;