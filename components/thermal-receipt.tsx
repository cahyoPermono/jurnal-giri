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
            width: 48mm;
            font-family: 'Courier New', monospace;
            font-size: 10px;
            line-height: 1.2;
            margin: 0 auto;
            padding: 5mm;
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
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>KB SUNAN GIRI</div>
          <div style={{ fontSize: '10px' }}>Jl. Contoh No. 123</div>
          <div style={{ fontSize: '10px' }}>Jember, Jawa Timur</div>
        </div>

        {/* Separator */}
        <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>

        {/* Transaction Info */}
        <div style={{ marginBottom: '5px' }}>
          <div>No: {transaction.id.slice(-8).toUpperCase()}</div>
          <div>Tgl: {formatDate(transaction.date)}</div>
        </div>

        {/* Separator */}
        <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>

        {/* Description */}
        <div style={{ marginBottom: '5px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>Deskripsi:</div>
          <div style={{ wordWrap: 'break-word' }}>{transaction.description}</div>
        </div>

        {/* Transaction Details */}
        <div style={{ marginBottom: '5px' }}>
          <div>Tipe: {transaction.type === 'DEBIT' ? 'PEMASUKAN' : transaction.type === 'CREDIT' ? 'PENGELUARAN' : 'TRANSFER'}</div>
          {transaction.accountName && <div>Akun: {transaction.accountName}</div>}
          {transaction.categoryName && <div>Kategori: {transaction.categoryName}</div>}
          {transaction.studentName && <div>Siswa: {transaction.studentName}</div>}
        </div>

        {/* Amount */}
        <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '5px 0', margin: '5px 0', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
            {formatCurrency(transaction.amount)}
          </div>
        </div>

        {/* Recorded By */}
        <div style={{ marginBottom: '5px', fontSize: '9px' }}>
          <div>Dicatat oleh: {transaction.userName}</div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '9px' }}>
          <div>Terima Kasih</div>
          <div>KB SUNAN GIRI</div>
        </div>

        {/* Signatures */}
        <div style={{ marginTop: '15px', fontSize: '9px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center' }}>
              <div>Pengelola KB</div>
              <div style={{ marginTop: '20px' }}></div>
              <div>Zulfa Mazidah, S.Pd.I</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div>Bendahara</div>
              <div style={{ marginTop: '20px' }}></div>
              <div>Wiwin Fauziyah, S.sos</div>
            </div>
          </div>
        </div>

        {/* Print timestamp */}
        <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '8px', borderTop: '1px dashed #000', paddingTop: '5px' }}>
          <div>Diprint: {new Date().toLocaleString('id-ID')}</div>
        </div>
      </div>
    </>
  );
}
