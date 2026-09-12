import type { PainPoint } from '@/src/components/PainMap';

export async function renderPainMapImage(points: PainPoint[]): Promise<string> {
  if (!points.length) return '';
  const image = new Image();
  image.src = `${import.meta.env.BASE_URL}clinical/pain-map-original.png`;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Não foi possível preparar o mapa da dor para o PDF.'));
  });

  const width = 720;
  const height = Math.round((image.naturalHeight / image.naturalWidth) * width);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('O navegador não conseguiu preparar o mapa da dor.');
  context.drawImage(image, 0, 0, width, height);
  points.forEach((point, index) => {
    const x = (point.x / 100) * width;
    const y = (point.y / 100) * height;
    context.beginPath();
    context.arc(x, y, 14, 0, Math.PI * 2);
    context.fillStyle = '#f5803e';
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = '#ffffff';
    context.stroke();
    context.fillStyle = '#ffffff';
    context.font = 'bold 15px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(String(index + 1), x, y + 1);
  });
  return canvas.toDataURL('image/jpeg', 0.86);
}

