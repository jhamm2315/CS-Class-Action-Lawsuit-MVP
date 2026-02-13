import React from 'react';

const ExhibitDownload = () => {
  const handleDownload = () => {
    const text = `
      CLASS ACTION EVIDENCE EXHIBIT
      ------------------------------
      • Total Signatures: 8532
      • Sentiment Score: +0.81
      • Keywords: "fraud", "due process", "garnishment"
      • Weekly Uptick: +23%
      • Location Spread: 38 States

      Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'Code1983_Evidence_Exhibit.txt';
    link.href = url;
    link.click();
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <button onClick={handleDownload}>
        Download Private Evidence Exhibit
      </button>
    </div>
  );
};

export default ExhibitDownload;