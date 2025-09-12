import { jsPDF } from "jspdf";

export async function exportToPdf(elementId: string, filename: string) {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error("Element not found for PDF export:", elementId);
    return;
  }

  try {
    // Check if this is the rekap-semester report
    const isRekapSemester = elementId === 'rekap-semester-report';

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

    if (isRekapSemester) {
      // Custom header for rekap semester
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REKAP PENERIMAAN - PENGELUARAN', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      pdf.setFontSize(12);
      pdf.text('KB SUNAN GIRI', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      // Extract semester and academic year from form
      const semesterElements = input.querySelectorAll('p');
      let semester = '1';
      let academicYear = '';
      semesterElements.forEach(p => {
        const text = p.textContent || '';
        const semesterMatch = text.match(/Semester: (\d)/);
        const yearMatch = text.match(/Tahun Ajaran: (\d{4}\/\d{4})/);
        if (semesterMatch) semester = semesterMatch[1];
        if (yearMatch) academicYear = yearMatch[1];
      });

      pdf.text(`SEMESTER ${semester}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;
      pdf.text(`TAHUN AJARAN ${academicYear}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
    } else {
      // Default header for other reports
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

    if (isRekapSemester) {
      // Draw table with full borders for rekap semester
      const tableStartY = yPosition;
      const rowHeight = 10;
      const tableWidth = pageWidth - 2 * margin;

      // Draw table headers with borders
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setFillColor(240, 240, 240); // Light gray background

      // Header background
      pdf.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F');

      headers.forEach((header, index) => {
        const x = margin + (index * columnWidth);
        pdf.text(header, x + 2, yPosition + 3);

        // Draw vertical lines
        pdf.line(x, tableStartY - 5, x, tableStartY - 5 + rowHeight);
      });

      // Draw header borders
      pdf.rect(margin, yPosition - 5, tableWidth, rowHeight);
      yPosition += rowHeight;

      // Draw table rows with borders
      pdf.setFont('helvetica', 'normal');
      rows.forEach((row) => {
        row.forEach((cell, cellIndex) => {
          const x = margin + (cellIndex * columnWidth);
          pdf.text(cell, x + 2, yPosition + 3);

          // Draw vertical lines for each cell
          pdf.line(x, yPosition - 5, x, yPosition - 5 + rowHeight);
        });

        // Draw horizontal line and rectangle for row
        pdf.rect(margin, yPosition - 5, tableWidth, rowHeight);
        yPosition += rowHeight;
      });

      // Add signature section
      yPosition += 5;

      // Left signature
      pdf.setFontSize(10);
      pdf.text('Mengetahui,', margin, yPosition);

      // Right signature
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      pdf.text(`Jember, ${formattedDate}`, pageWidth - margin - 60, yPosition);

      // Align titles at the same level
      const titleY = yPosition + 8;
      pdf.text('Pengelola KB Sunan Giri', margin, titleY);
      pdf.text('Bendahara', pageWidth - margin - 60, titleY);

      // Place both signatures at the same level
      const signatureY = titleY + 20;
      pdf.text('(Zulfa Mazidah, S.Pd.I)', margin, signatureY);
      pdf.text('(Wiwin Fauziyah)', pageWidth - margin - 60, signatureY);

      // Add approval section
      const approvalY = signatureY + 25;
      pdf.text('Menyetujui,', pageWidth / 2 - 20, approvalY); // Move 20mm to the left

      // Approval signatures - match spacing with first section
      const approvalTitleY = approvalY + 8;
      const approvalSignatureY = approvalTitleY + 20;
      pdf.text('Ketua Yayasan', margin, approvalTitleY);
      pdf.text('Komite', pageWidth - margin - 60, approvalTitleY);

      pdf.text('(Hj. Aminah As\'adi, S.Pd)', margin, approvalSignatureY);
      pdf.text('(H. Sutrisno Abdurrahman)', pageWidth - margin - 60, approvalSignatureY);

    } else {
      // Default table rendering for other reports
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
    }

    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  }
}
