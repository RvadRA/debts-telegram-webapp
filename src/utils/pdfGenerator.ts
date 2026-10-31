import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePdfFromElement(
  element: HTMLElement,
  fileName: string,
  options?: { quality?: number; orientation?: 'p' | 'l' }
): Promise<Blob> {
  // Options
  const orientation = options?.orientation || 'p';
  const scale = window.devicePixelRatio && window.devicePixelRatio > 1 ? 2 : 2;

  // Render element to canvas with crisp scaling
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: element.scrollWidth,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  
  // A4 dimensions in mm
  const pdfWidth = orientation === 'p' ? 210 : 297;
  const pdfHeight = orientation === 'p' ? 297 : 210;

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Scale image to fit A4 width with margins
  const margin = 10;
  const contentWidth = pdfWidth - margin * 2;
  const contentHeight = (canvasHeight * contentWidth) / canvasWidth;

  if (contentHeight <= pdfHeight - margin * 2) {
    // Fits in single page
    pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight);
  } else {
    // Multi-page handling
    let heightLeft = contentHeight;
    let position = margin;

    pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
    heightLeft -= pdfHeight - margin * 2;

    while (heightLeft > 0) {
      position = -(contentHeight - heightLeft) + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
      heightLeft -= pdfHeight - margin * 2;
    }
  }

  // Trigger download directly
  pdf.save(fileName);

  // Return Blob for sharing
  return pdf.output('blob');
}
