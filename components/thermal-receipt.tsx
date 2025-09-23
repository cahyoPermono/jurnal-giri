import React from 'react';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "DEBIT" | "CREDIT" | "TRANSFER";
  accountName?: string;
  categoryName?: string;
  studentName?: string;
  studentNis?: string;
  studentGroup?: string;
  userName?: string;
}

interface ThermalReceiptProps {
  transaction: Transaction;
  onClose?: () => void;
}

export default function ThermalReceipt({ transaction, onClose }: ThermalReceiptProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: 58mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .thermal-receipt {
            width: 52mm;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            font-weight: bold;
            line-height: 1.2;
            margin: 0 auto;
            padding: 3mm;
            background: white;
            color: black;
          }
          .thermal-receipt * {
            box-sizing: border-box;
          }
          .no-print {
            display: none !important;
          }
        }
        @media screen {
          .thermal-receipt {
            width: 58mm;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            margin: 20px auto;
            padding: 10px;
            border: 1px solid #ccc;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      <div className="thermal-receipt">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '5px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '3px' }}>KWITANSI PEMBAYARAN</div>
          <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Yayasan Pendidikan dan dakwah muslimat NU SUNAN GIRI</div>
          <div style={{ fontSize: '9px' }}>Taman pengasuhan anak INDIRA GIRI & Kelompok Bermain SUNAN GIRI</div>
          <div style={{ fontSize: '8px' }}>JL HOS COKROAMINOTO 7 Balung Jember 68181</div>
          <div style={{ fontSize: '8px' }}>WA 087743495335</div>
        </div>

        {/* Separator */}
        <div style={{ borderTop: '2px solid #000', margin: '8px 0' }}></div>

        {/* Receipt Number and Date */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
            <div><strong>No. Kwitansi:</strong> {transaction.id.slice(-8).toUpperCase()}</div>
            <div><strong>Tanggal:</strong> {formatDate(transaction.date)}</div>
          </div>
        </div>

        {/* Separator */}
        <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>

        {/* Student Details (if applicable) */}
        {transaction.studentName && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '3px' }}>TELAH TERIMA DARI:</div>
            <div style={{ fontSize: '9px' }}>Nama Siswa: {transaction.studentName}</div>
            {transaction.studentNis && <div style={{ fontSize: '9px' }}>NIS: {transaction.studentNis}</div>}
            {transaction.studentGroup && <div style={{ fontSize: '9px' }}>Kelompok: {transaction.studentGroup}</div>}
          </div>
        )}

        {/* Payment Details */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '3px' }}>UNTUK PEMBAYARAN:</div>
          <div style={{ fontSize: '9px', wordWrap: 'break-word' }}>{transaction.description}</div>
          {transaction.categoryName && <div style={{ fontSize: '9px' }}>Kategori: {transaction.categoryName}</div>}
        </div>

        {/* Amount Section */}
        <div style={{ border: '2px solid #000', padding: '8px', margin: '8px 0', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '3px' }}>JUMLAH BAYAR</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {formatCurrency(transaction.amount)}
          </div>
          <div style={{ fontSize: '9px', marginTop: '3px' }}>
            ({transaction.type === 'DEBIT' ? 'Pemasukan' : transaction.type === 'CREDIT' ? 'Pengeluaran' : 'Transfer'})
          </div>
        </div>

        {/* Account Info */}
        {transaction.accountName && (
          <div style={{ marginBottom: '8px', fontSize: '9px' }}>
            <div><strong>Akun:</strong> {transaction.accountName}</div>
          </div>
        )}

        {/* Recorded By */}
        <div style={{ marginBottom: '8px', fontSize: '9px' }}>
          <div><strong>Dicatat oleh:</strong> {transaction.userName}</div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '9px' }}>
          <div style={{ fontWeight: 'bold' }}>Terima Kasih atas Pembayaran Anda</div>
          <div style={{ marginTop: '3px' }}>KB SUNAN GIRI</div>
        </div>

        {/* Signatures */}
        <div style={{ marginTop: '15px', fontSize: '9px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '40px' }}>Pengelola KB</div>
              <div style={{ borderTop: '1px solid #000', paddingTop: '2px' }}>Zulfa Mazidah, S.Pd.I</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '40px' }}>Bendahara</div>
              <div style={{ borderTop: '1px solid #000', paddingTop: '2px' }}>Wiwin Fauziyah, S.sos</div>
            </div>
          </div>
        </div>

        {/* Print timestamp */}
        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '9px', borderTop: '1px dashed #000', paddingTop: '3px' }}>
          <div>Diprint: {new Date().toLocaleString('id-ID')}</div>
        </div>
      </div>
    </>
  );
}
