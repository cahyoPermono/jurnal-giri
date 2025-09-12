import { jsPDF } from "jspdf";

export async function exportToPdf(elementId: string, filename: string) {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error("Element not found for PDF export:", elementId);
    return;
  }

  try {
    // Extract table data directly from the DOM
    const table = input.querySelector('table');
    if (!table) {
      throw new Error('No table found in the element');
    }

    // Create PDF with jsPDF directly (no html2canvas)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Set up PDF styling
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Add title
    const titleElement = input.querySelector('h2') || input.querySelector('h1');
    const title = titleElement ? titleElement.textContent?.trim() : 'Report';
    pdf.setFontSize(18);
    pdf.text(title || 'Report', margin, yPosition);
    yPosition += 15;

    // Add date range if available
    const dateElements = input.querySelectorAll('input[type="text"], span');
    let dateRange = '';
    dateElements.forEach(el => {
      const text = el.textContent?.trim();
      if (text && /\d{1,2}\/\d{1,2}\/\d{4}/.test(text)) {
        dateRange += text + ' ';
      }
    });
    if (dateRange) {
      pdf.setFontSize(12);
      pdf.text(`Date Range: ${dateRange.trim()}`, margin, yPosition);
      yPosition += 10;
    }

    // Extract table headers
    const headers: string[] = [];
    const headerCells = table.querySelectorAll('thead th, thead td');
    headerCells.forEach(cell => {
      headers.push(cell.textContent?.trim() || '');
    });

    // Extract table rows
    const rows: string[][] = [];
    const bodyRows = table.querySelectorAll('tbody tr');
    bodyRows.forEach(row => {
      const rowData: string[] = [];
      const cells = row.querySelectorAll('td');
      cells.forEach(cell => {
        rowData.push(cell.textContent?.trim() || '');
      });
      rows.push(rowData);
    });

    // Calculate column widths
    const columnWidth = (pageWidth - 2 * margin) / headers.length;

    // Add table headers
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    headers.forEach((header, index) => {
      const x = margin + (index * columnWidth);
      pdf.text(header, x, yPosition);
    });
    yPosition += 8;

    // Add horizontal line
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;

    // Add table rows
    pdf.setFont('helvetica', 'normal');
    rows.forEach((row, rowIndex) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = margin;

        // Re-add headers on new page
        pdf.setFont('helvetica', 'bold');
        headers.forEach((header, index) => {
          const x = margin + (index * columnWidth);
          pdf.text(header, x, yPosition);
        });
        yPosition += 8;
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;
        pdf.setFont('helvetica', 'normal');
      }

      row.forEach((cell, cellIndex) => {
        const x = margin + (cellIndex * columnWidth);
        // Truncate long text to fit in column
        const maxLength = Math.floor(columnWidth / 2); // Approximate characters per mm
        const truncatedText = cell.length > maxLength ? cell.substring(0, maxLength - 3) + '...' : cell;
        pdf.text(truncatedText, x, yPosition);
      });
      yPosition += 6;
    });

    // Add footer
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, pageHeight - 10);
    }

    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  }
}
