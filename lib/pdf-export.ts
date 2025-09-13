import { jsPDF } from "jspdf";

export async function exportToPdf(elementId: string, filename: string, data?: any) {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error("Element not found for PDF export:", elementId);
    return;
  }

  try {
    // Check if this is the rekap-semester report
    const isRekapSemester = elementId === 'rekap-semester-report';
    const isRekapPenerimaanBulan = elementId === 'rekap-penerimaan-bulan-report';
    const isLaporanKeuanganBulanan = elementId === 'laporan-keuangan-bulanan-report';

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
    } else if (isLaporanKeuanganBulanan) {
      // Custom header for laporan keuangan bulanan
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('LAPORAN KEUANGAN BULANAN', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      pdf.setFontSize(12);
      pdf.text('KB SUNAN GIRI', pageWidth / 2, yPosition, { align: 'center' });
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

      pdf.text(`BULAN ${monthName} ${year}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
    } else if (elementId === 'transactions-table') {
      // Custom header for transactions table
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('LAPORAN TRANSAKSI', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      pdf.setFontSize(12);
      pdf.text('KB SUNAN GIRI', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      // Extract date range
      const dateRangeElement = input.querySelector('#date-range');
      let dateRangeText = '';
      if (dateRangeElement) {
        dateRangeText = dateRangeElement.textContent || '';
        const match = dateRangeText.match(/Tanggal: (.+)/);
        if (match) dateRangeText = match[1];
      }

      if (dateRangeText) {
        pdf.text(dateRangeText, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 8;
      }

      yPosition += 7;
    } else if (elementId === 'student-liabilities-report' && data) {
      // Custom header for student liabilities report
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Laporan Liabiliti Siswa', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      pdf.setFontSize(14);
      pdf.text('KB Sunan Giri', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // List students and their liabilities
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');

      data.forEach((student: any) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = margin;
        }

        // Student name and NIS
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${student.name} (${student.nis})`, margin, yPosition);
        yPosition += 8;

        // Liabilities
        pdf.setFont('helvetica', 'normal');
        if (student.unpaidItems.length === 0) {
          pdf.text('- Tidak ada hutang', margin + 10, yPosition);
          yPosition += 8;
        } else {
          student.unpaidItems.forEach((item: any) => {
            const itemText = `- ${item.type}${item.month ? ` (${item.month})` : ''}: Rp ${item.amount.toFixed(2)}`;
            pdf.text(itemText, margin + 10, yPosition);
            yPosition += 6;
          });
        }
        yPosition += 10; // Space between students
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

      pdf.save(filename);
      return;
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
    let headers: string[] = [];
    const headerCells = table.querySelectorAll('thead th, thead td');
    headerCells.forEach(cell => {
      headers.push(cell.textContent?.trim() || '');
    });

    // Extract table rows
    let rows: string[][] = [];
    const bodyRows = table.querySelectorAll('tbody tr');
    bodyRows.forEach(row => {
      const rowData: string[] = [];
      const cells = row.querySelectorAll('td');
      cells.forEach(cell => {
        rowData.push(cell.textContent?.trim() || '');
      });
      rows.push(rowData);
    });

    // For transactions table, exclude the "Recorded By" column (last column)
    if (elementId === 'transactions-table') {
      headers = headers.slice(0, -1); // Remove last header
      rows = rows.map(row => row.slice(0, -1)); // Remove last column from each row
    }

    // Calculate column widths - custom widths for different reports
    let columnWidths: number[] = [];
    if (isRekapPenerimaanBulan) {
      // Custom widths: No (narrow), Tanggal, Uraian (wide), Debet, Saldo
      const totalWidth = pageWidth - 2 * margin;
      columnWidths = [
        totalWidth * 0.05, // No - 5%
        totalWidth * 0.25, // Tanggal - 25%
        totalWidth * 0.36, // Uraian - 36%
        totalWidth * 0.17, // Debet - 17%
        totalWidth * 0.17  // Saldo - 17%
      ];
    } else if (isLaporanKeuanganBulanan) {
      // Custom widths for laporan keuangan bulanan: No, Penerimaan, Total, No, Pengeluaran, Total
      const totalWidth = pageWidth - 2 * margin;
      columnWidths = [
        totalWidth * 0.05, // No1 - 5%
        totalWidth * 0.20, // Penerimaan - 20%
        totalWidth * 0.20, // Total Penerimaan - 20%
        totalWidth * 0.05, // No2 - 5%
        totalWidth * 0.20, // Pengeluaran - 20%
        totalWidth * 0.20  // Total Pengeluaran - 20%
      ];
    } else {
      // Equal widths for other reports
      const columnWidth = (pageWidth - 2 * margin) / headers.length;
      columnWidths = new Array(headers.length).fill(columnWidth);
    }

    if (isRekapSemester || isRekapPenerimaanBulan || isLaporanKeuanganBulanan || elementId === 'transactions-table') {
      // Draw table with full borders for rekap reports and transactions
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
      // Draw the rightmost vertical line for the header
      const lastHeaderX = margin + tableWidth;
      pdf.line(lastHeaderX, tableStartY - 5, lastHeaderX, tableStartY - 5 + rowHeight);


      // Draw header borders
      pdf.rect(margin, yPosition - 5, tableWidth, rowHeight);
      yPosition += rowHeight;

      // Draw table rows with borders
      pdf.setFont('helvetica', 'normal');
      rows.forEach((row) => {
        const currentY = yPosition;
        let maxRowHeight = rowHeight;

        // Pre-calculate max row height for text wrapping
        if (isRekapPenerimaanBulan && row[2]) {
          const uraianCellText = row[2] || '';
          const uraianCellWidth = columnWidths[2] - 4; // account for padding
          const lines = pdf.splitTextToSize(uraianCellText, uraianCellWidth);
          const textHeight = lines.length * 5; // approximate line height. 5mm per line.
          const requiredHeight = textHeight + 8; // text starts at y+3, rect at y-5, so 8mm difference for padding
          if (requiredHeight > maxRowHeight) {
            maxRowHeight = requiredHeight;
          }
        } else if (elementId === 'transactions-table') {
          // Check columns that might have long text for text wrapping: description (1), account (4), category (5), student (6)
          [1, 4, 5, 6].forEach(colIndex => {
            if (row[colIndex]) {
              const cellText = row[colIndex];
              const cellWidth = columnWidths[colIndex] - 4;
              const lines = pdf.splitTextToSize(cellText, cellWidth);
              const textHeight = lines.length * 5;
              const requiredHeight = textHeight + 8;
              if (requiredHeight > maxRowHeight) {
                maxRowHeight = requiredHeight;
              }
            }
          });
        }

        // Draw the rectangle for the entire row
        pdf.rect(margin, currentY - 5, tableWidth, maxRowHeight);

        row.forEach((cell, cellIndex) => {
          const x = margin + columnWidths.slice(0, cellIndex).reduce((sum, width) => sum + width, 0);
          const cellWidth = columnWidths[cellIndex] - 4;

          // Draw cell content with text wrapping
          if (isRekapPenerimaanBulan && cellIndex === 2) {
            const lines = pdf.splitTextToSize(cell, cellWidth);
            pdf.text(lines, x + 2, currentY + 3);
          } else if (elementId === 'transactions-table' && [1, 4, 5, 6].includes(cellIndex)) {
            const lines = pdf.splitTextToSize(cell, cellWidth);
            pdf.text(lines, x + 2, currentY + 3);
          } else {
            pdf.text(cell, x + 2, currentY + 3);
          }

          // Draw vertical divider lines
          const nextX = margin + columnWidths.slice(0, cellIndex + 1).reduce((sum, width) => sum + width, 0);
          if (cellIndex < headers.length - 1) {
            pdf.line(nextX, currentY - 5, nextX, currentY - 5 + maxRowHeight);
          }
        });

        yPosition += maxRowHeight;
      });

      // Add saldo akhir for laporan keuangan bulanan
      if (isLaporanKeuanganBulanan) {
        yPosition += 10;
        // Extract saldo akhir from the page
        const saldoAkhirElements = input.querySelectorAll('p');
        let saldoAkhir = '';
        saldoAkhirElements.forEach(p => {
          const text = p.textContent || '';
          const saldoMatch = text.match(/Saldo akhir bulan: (.+)/);
          if (saldoMatch) saldoAkhir = saldoMatch[1].trim();
        });
        if (saldoAkhir) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Saldo akhir bulan: ${saldoAkhir}`, pageWidth - margin - 80, yPosition);
          yPosition += 15;
        }
      }

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
