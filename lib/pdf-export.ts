import { jsPDF } from "jspdf";

export async function exportToPdf(elementId: string, filename: string, data?: any) {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error("Element not found for PDF export:", elementId);
    return;
  }

  // Helper function to format date to Indonesian format
  const formatIndonesianDate = (dateString: string): string => {
    if (!dateString || dateString === "") return "";
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateString;
    }
  };

  // Helper function to format number to Indonesian Rupiah
  const formatRupiah = (amount: string | number): string => {
    if (!amount || amount === "" || amount === "0") return "";
    try {
      const num = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (isNaN(num)) return amount.toString();

      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(num);
    } catch {
      return amount.toString();
    }
  };

  try {
    // Check if this is the rekap-semester report
    const isRekapSemester = elementId === 'rekap-semester-report';
    const isRekapPenerimaanBulan = elementId === 'rekap-penerimaan-bulan-report';
    const isLaporanKeuanganBulanan = elementId === 'laporan-keuangan-bulanan-report';
    const isBukuKasBulanan = elementId === 'buku-kas-bulanan-report';

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

      // Determine type from data or default to penerimaan
      const reportType = data?.type || 'penerimaan';
      const headerText = reportType === 'pengeluaran'
        ? 'REKAP PENGELUARAN KB SUNAN GIRI'
        : 'REKAP PENERIMAAN KB SUNAN GIRI';

      pdf.text(headerText, pageWidth / 2, yPosition, { align: 'center' });
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
    } else if (isBukuKasBulanan) {
      // Custom header for buku kas bulanan
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BUKU KAS KB SUNAN GIRI', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      // Extract bulan, tahun, and minggu from the page
      const bulanElements = input.querySelectorAll('p, span, div');
      let bulanName = '';
      let tahun = '';
      let minggu = '';
      bulanElements.forEach(el => {
        const text = el.textContent || '';
        // Look for bulan name
        const bulanNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        bulanNames.forEach(name => {
          if (text.includes(name)) bulanName = name;
        });
        // Look for tahun
        const tahunMatch = text.match(/(\d{4})/);
        if (tahunMatch && !tahun) tahun = tahunMatch[1];
        // Look for minggu
        if (text.includes('Minggu ke 1-2')) minggu = 'Minggu ke 1-2';
        if (text.includes('Minggu ke 3-4')) minggu = 'Minggu ke 3-4';
      });

      pdf.setFontSize(12);
      pdf.text(`BULAN ${bulanName} ${tahun}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;
      pdf.text(minggu, pageWidth / 2, yPosition, { align: 'center' });
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
          const itemText = `- ${item.type}${item.month ? ` (${item.month})` : ''}: ${formatRupiah(item.amount)}`;
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

    // For transactions table, exclude the "Recorded By", "Proof", and "Print" columns (last three columns)
    if (elementId === 'transactions-table') {
      headers = headers.slice(0, -3); // Remove last three headers
      rows = rows.map(row => row.slice(0, -3)); // Remove last three columns from each row
    }

    // Calculate column widths - custom widths for different reports
    let columnWidths: number[] = [];
    if (isRekapPenerimaanBulan) {
      // Custom widths: No (narrow), Tanggal, Uraian (wide), Amount, Saldo
      const totalWidth = pageWidth - 2 * margin;
      columnWidths = [
        totalWidth * 0.05, // No - 5%
        totalWidth * 0.25, // Tanggal - 25%
        totalWidth * 0.36, // Uraian - 36%
        totalWidth * 0.17, // Amount (Debet/Credit) - 17%
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
    } else if (isBukuKasBulanan) {
      // Custom widths for buku kas bulanan: Tanggal, No (narrow), Uraian (wide), Debet, Credit, Saldo
      const totalWidth = pageWidth - 2 * margin;
      columnWidths = [
        totalWidth * 0.20, // Tanggal - 20% (diperlebar agar tidak menabrak)
        totalWidth * 0.06, // No - 6% (narrow for numbers up to hundreds)
        totalWidth * 0.28, // Uraian - 28% (dikecilkan sedikit agar lebih proporsional)
        totalWidth * 0.155, // Debet - 15.5%
        totalWidth * 0.155, // Credit - 15.5%
        totalWidth * 0.155  // Saldo - 15.5%
      ];
    } else if (elementId === 'transactions-table') {
      // Custom widths for transactions table: Tanggal, Deskripsi, Jumlah, Tipe, Akun, Kategori, Siswa
      // After removing "Dicatat Oleh", "Bukti", and "Print" columns from PDF export
      const totalWidth = pageWidth - 2 * margin;
      columnWidths = [
        totalWidth * 0.12, // Tanggal - 12%
        totalWidth * 0.28, // Deskripsi - 28%
        totalWidth * 0.12, // Jumlah - 12%
        totalWidth * 0.10, // Tipe - 10%
        totalWidth * 0.12, // Akun - 12%
        totalWidth * 0.12, // Kategori - 12%
        totalWidth * 0.14  // Siswa - 14%
      ];
    } else {
      // Equal widths for other reports
      const columnWidth = (pageWidth - 2 * margin) / headers.length;
      columnWidths = new Array(headers.length).fill(columnWidth);
    }

    if (isRekapSemester || isRekapPenerimaanBulan || isLaporanKeuanganBulanan || isBukuKasBulanan || elementId === 'transactions-table') {
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
      rows.forEach((row, rowIndex) => {
        const currentY = yPosition;
        let maxRowHeight = rowHeight;

        // Check if this is an empty row (for Buku Kas Bulanan spacing)
        const isEmptyRow = isBukuKasBulanan && (
          row.every(cell => cell === "" || cell === "0") ||
          (row.length === 1 && row[0] === "") ||
          (row.length === 6 && row.every(cell => cell === "" || cell === "0"))
        );

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
        } else if (isBukuKasBulanan && row[2] && !isEmptyRow) {
          // Text wrapping for Uraian column (index 2) in Buku Kas Bulanan
          const uraianCellText = row[2] || '';
          const uraianCellWidth = columnWidths[2] - 4; // account for padding
          const lines = pdf.splitTextToSize(uraianCellText, uraianCellWidth);
          const textHeight = lines.length * 5; // approximate line height. 5mm per line.
          const requiredHeight = textHeight + 8; // text starts at y+3, rect at y-5, so 8mm difference for padding
          if (requiredHeight > maxRowHeight) {
            maxRowHeight = requiredHeight;
          }
        } else if (elementId === 'transactions-table') {
          // Check all columns that might have long text for text wrapping
          row.forEach((cell, colIndex) => {
            if (cell) {
              const cellText = cell;
              const cellWidth = columnWidths[colIndex] - 4;
              const lines = pdf.splitTextToSize(cellText, cellWidth);
              const textHeight = lines.length * 5; // approximate line height. 5mm per line.
              const requiredHeight = textHeight + 8; // text starts at y+3, rect at y-5, so 8mm difference for padding
              if (requiredHeight > maxRowHeight) {
                maxRowHeight = requiredHeight;
              }
            }
          });
        }

        // Ensure empty rows have minimum height for proper border display
        if (isEmptyRow) {
          maxRowHeight = Math.max(maxRowHeight, 8); // Minimum height for empty rows
        }

        // Check if we need a new page before drawing this row
        if (yPosition + maxRowHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;

          // Redraw table headers on new page
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.setFillColor(240, 240, 240); // Light gray background

          // Header background
          pdf.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F');

          headers.forEach((header, index) => {
            const x = margin + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
            pdf.text(header, x + 2, yPosition + 3);

            // Draw vertical lines
            pdf.line(x, yPosition - 5, x, yPosition - 5 + rowHeight);
          });
          // Draw the rightmost vertical line for the header
          const lastHeaderX = margin + tableWidth;
          pdf.line(lastHeaderX, yPosition - 5, lastHeaderX, yPosition - 5 + rowHeight);

          // Draw header borders
          pdf.rect(margin, yPosition - 5, tableWidth, rowHeight);
          yPosition += rowHeight;

          // Reset font for rows
          pdf.setFont('helvetica', 'normal');
        }

        // Draw the rectangle for the entire row
        pdf.rect(margin, yPosition - 5, tableWidth, maxRowHeight);

        // Handle empty rows differently - draw all vertical lines even if no content
        if (isEmptyRow) {
          // For empty rows, draw all vertical lines to create proper grid
          for (let cellIndex = 0; cellIndex < headers.length; cellIndex++) {
            const nextX = margin + columnWidths.slice(0, cellIndex + 1).reduce((sum, width) => sum + width, 0);
            if (cellIndex < headers.length - 1) {
              pdf.line(nextX, yPosition - 5, nextX, yPosition - 5 + maxRowHeight);
            }
          }
        } else {
          // Normal row processing
          row.forEach((cell, cellIndex) => {
            const x = margin + columnWidths.slice(0, cellIndex).reduce((sum, width) => sum + width, 0);
            const cellWidth = columnWidths[cellIndex] - 4;

            let displayText = cell;

            // Apply formatting for Buku Kas Bulanan
            if (isBukuKasBulanan) {
              if (cellIndex === 0) {
                // Format tanggal untuk kolom Tanggal (index 0)
                displayText = formatIndonesianDate(cell);
              } else if ([3, 4, 5].includes(cellIndex)) {
                // Format Rupiah untuk kolom Debet, Credit, Saldo (index 3, 4, 5)
                displayText = formatRupiah(cell);
              }
            }

            // Apply formatting for Rekap Penerimaan Bulan
            if (isRekapPenerimaanBulan) {
              if ([3, 4].includes(cellIndex)) {
                // Format Rupiah untuk kolom Amount dan Saldo (index 3, 4)
                displayText = formatRupiah(cell);
              }
            }

            // Apply formatting for Laporan Keuangan Bulanan
            if (isLaporanKeuanganBulanan) {
              if ([2, 5].includes(cellIndex)) {
                // Format Rupiah untuk kolom Total Penerimaan dan Total Pengeluaran (index 2, 5)
                displayText = formatRupiah(cell);
              }
            }

            // Apply formatting for Rekap Semester
            if (isRekapSemester) {
              if ([1, 2, 3, 4].includes(cellIndex)) {
                // Format Rupiah untuk kolom Saldo Awal, Penerimaan, Pengeluaran, Saldo Akhir (index 1, 2, 3, 4)
                displayText = formatRupiah(cell);
              }
            }

            // Apply formatting for Transactions Table
            if (elementId === 'transactions-table') {
              if (cellIndex === 2) {
                // Format Rupiah untuk kolom Jumlah (index 2)
                displayText = formatRupiah(cell);
              }
              // Apply additional formatting for better readability
              if (cellIndex === 0) {
                // Format date for Tanggal column
                displayText = formatIndonesianDate(cell);
              }
            }

            // Draw cell content with text wrapping
            if (isRekapPenerimaanBulan && cellIndex === 2) {
              const lines = pdf.splitTextToSize(displayText, cellWidth);
              pdf.text(lines, x + 2, yPosition + 3);
            } else if (isBukuKasBulanan && cellIndex === 2) {
              // Text wrapping for Uraian column (index 2) in Buku Kas Bulanan
              const lines = pdf.splitTextToSize(displayText, cellWidth);
              pdf.text(lines, x + 2, yPosition + 3);
            } else if (elementId === 'transactions-table') {
              // Apply text wrapping to all cells in transactions table for better presentation
              const lines = pdf.splitTextToSize(displayText, cellWidth);
              pdf.text(lines, x + 2, yPosition + 3);
            } else {
              pdf.text(displayText, x + 2, yPosition + 3);
            }

            // Draw vertical divider lines
            const nextX = margin + columnWidths.slice(0, cellIndex + 1).reduce((sum, width) => sum + width, 0);
            if (cellIndex < headers.length - 1) {
              pdf.line(nextX, yPosition - 5, nextX, yPosition - 5 + maxRowHeight);
            }
          });
        }

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

      if (isRekapSemester) {
        // Special signature layout for rekap semester with additional signatures
        // Mengatahui aligned with the date on the left
        pdf.text('Mengatahui,', margin, yPosition);

        // First row: Pengelola KB and Bendahara
        const firstTitleY = yPosition + 5;
        pdf.text('Pengelola KB', margin, firstTitleY);
        pdf.text('Bendahara', pageWidth - margin - 60, firstTitleY);

        // First row signatures
        const firstSignatureY = firstTitleY + 20;
        pdf.text('(Zulfa Mazidah, S.Pd.I)', margin, firstSignatureY);
        pdf.text('(Wiwin Fauziyah, S.sos)', pageWidth - margin - 60, firstSignatureY);

        // Second row: Menyetujui (center)
        const secondTitleY = firstSignatureY + 15;
        pdf.text('Menyetujui,', pageWidth / 2, secondTitleY, { align: 'center' });

        // Third row: Ketua yayasan (left) and Komite (right)
        const thirdTitleY = secondTitleY + 15;
        pdf.text('Ketua yayasan', margin, thirdTitleY);
        pdf.text('Komite', pageWidth - margin - 60, thirdTitleY);

        // Third row signatures
        const thirdSignatureY = thirdTitleY + 20;
        pdf.text('(Hj. Aminah As\'adi, S.pd)', margin, thirdSignatureY);
        pdf.text('(H. Sutrisno Abdurrahman)', pageWidth - margin - 60, thirdSignatureY);
      } else {
        // Standard signature layout for other reports
        // Align titles at the same level
        const titleY = yPosition + 8;
        pdf.text('Pengelola KB', margin, titleY);
        pdf.text('Bendahara', pageWidth - margin - 60, titleY);

        // Place both signatures at the same level
        const signatureY = titleY + 20;
        pdf.text('(Zulfa Mazidah, S.Pd.I)', margin, signatureY);
        pdf.text('(Wiwin Fauziyah, S.sos)', pageWidth - margin - 60, signatureY);
      }

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
