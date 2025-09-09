import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function exportToPdf(elementId: string, filename: string) {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error("Element not found for PDF export:", elementId);
    return;
  }

  // Temporarily adjust styles for better PDF rendering
  const originalStyles = {
    width: input.style.width,
    height: input.style.height,
    overflow: input.style.overflow,
  };
  input.style.width = "auto";
  input.style.height = "auto";
  input.style.overflow = "visible";

  try {
    const canvas = await html2canvas(input, {
      scale: 2, // Increase scale for better resolution
      useCORS: true, // Enable CORS if images are from external sources
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [canvas.width, canvas.height], // Set PDF size to canvas size
    });

    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    // Restore original styles
    input.style.width = originalStyles.width;
    input.style.height = originalStyles.height;
    input.style.overflow = originalStyles.overflow;
  }
}
