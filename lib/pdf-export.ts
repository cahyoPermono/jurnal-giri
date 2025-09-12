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
    const isRekapPenerimaanBulan = elementId === 'rekap-penerimaan-bulan-report';

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
    } else if (isRekapPenerimaanBulan) {
      // Custom header for rekap penerimaan bulan
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REKAP PENERIMAAN KB SUNAN GIRI', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      // Extract month and year from the page
      const monthElements = input.querySelectorAll('p');
      let monthName = '';
      let year = '';
      monthElements.forEach(p => {
        const text = p.textContent || '';
        const monthMatch = text.match(/Bulan: ([^\n]+)/);
        const yearMatch = text.match(/Tahun: (\d{4})/);
        if (monthMatch) monthName = monthMatch[1].trim();
        if (yearMatch) year = yearMatch[1];
      });

      pdf.setFontSize(12);
      pdf.text(`BULAN ${monthName} ${year}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
    } else if (elementId === 'transactions-table') {
      // Custom header for transactions table
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Transaction Report', margin, yPosition);
      yPosition += 15;

      // Add current date
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += 10;
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

    // Calculate column widths - custom widths for rekap penerimaan bulan
    let columnWidths: number[] = [];
    if (isRekapPenerimaanBulan) {
      // Custom widths: No (narrow), Tanggal, Uraian (wide), Debet, Saldo
      const totalWidth = pageWidth - 2 * margin;
      columnWidths = [
        totalWidth * 0.08, // No - 8%
        totalWidth * 0.18, // Tanggal - 18%
        totalWidth * 0.40, // Uraian - 40%
        totalWidth * 0.17, // Debet - 17%
        totalWidth * 0.17  // Saldo - 17%
      ];
    } else {
      // Equal widths for other reports
      const columnWidth = (pageWidth - 2 * margin) / headers.length;
      columnWidths = new Array(headers.length).fill(columnWidth);
    }

    if (isRekapSemester || isRekapPenerimaanBulan) {
      // Draw table with full borders for rekap reports
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
        const x = margin + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
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
        let currentY = yPosition;
        let maxRowHeight = rowHeight;

        row.forEach((cell, cellIndex) => {
          const x = margin + columnWidths.slice(0, cellIndex).reduce((sum, width) => sum + width, 0);
          const cellWidth = columnWidths[cellIndex] - 4; // Account for padding

          if (cellIndex === 2) { // Uraian column (index 2: No, Tanggal, Uraian, Debet, Saldo)
            // Handle text wrapping for Uraian column
            const lines = pdf.splitTextToSize(cell, cellWidth);
            const cellHeight = lines.length * 5; // Approximate line height
            if (cellHeight > maxRowHeight) {
              maxRowHeight = cellHeight + 10; // Add some padding
            }

            // Draw wrapped text
            pdf.text(lines, x + 2, currentY + 3);
          } else {
            // Regular text for other columns
            pdf.text(cell, x + 2, currentY + 3);
          }

          // Draw vertical lines for each cell
          const nextX = margin + columnWidths.slice(0, cellIndex + 1).reduce((sum, width) => sum + width, 0);
          pdf.line(nextX, yPosition - 5, nextX, yPosition - 5 + maxRowHeight);
        });

        // Draw horizontal line and rectangle for row with adjusted height
        pdf.rect(margin, yPosition - 5, tableWidth, maxRowHeight);
        yPosition += maxRowHeight;
      });

      // Add signature section
      yPosition += 10;

      // Date above signatures
      const currentDate = new Date();
      const formattedDate = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;

      pdf.setFontSize(10);
      pdf.text(`Jember, ${formattedDate}`, pageWidth - margin - 60, yPosition);

      // Align titles at the same level
      const titleY = yPosition + 8;
      pdf.text('Pengelola KB', margin, titleY);
      pdf.text('Bendahara', pageWidth - margin - 60, titleY);

      // Place both signatures at the same level
      const signatureY = titleY + 20;
      pdf.text('(Zulfa Mazidah, S.Pd.I)', margin, signatureY);
      pdf.text('(Wiwin Fauziyah, S.sos)', pageWidth - margin - 60, signatureY);

    } else {
      // Default table rendering for other reports
      // Add table headers
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      headers.forEach((header, index) => {
        const x = margin + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
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
            const x = margin + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
            pdf.text(header, x, yPosition);
          });
          yPosition += 8;
          pdf.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 5;
          pdf.setFont('helvetica', 'normal');
        }

        row.forEach((cell, cellIndex) => {
          const x = margin + columnWidths.slice(0, cellIndex).reduce((sum, width) => sum + width, 0);
          // Truncate long text to fit in column
          const maxLength = Math.floor(columnWidths[cellIndex] / 2); // Approximate characters per mm
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
