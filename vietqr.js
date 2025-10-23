// vietqr.js
import QRCode from 'qrcode';

/**
 * Hàm tính CRC16-CCITT-FALSE
 */
function calcCRC(str) {
  const crcTable = (() => {
    const table = new Array(256);
    for (let i = 0; i < 256; i++) {
      let crc = i << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      }
      table[i] = crc & 0xFFFF;
    }
    return table;
  })();

  let crc = 0xFFFF;
  const bytes = Buffer.from(str, 'utf8');
  for (const b of bytes) {
    const idx = ((b ^ (crc >> 8)) & 0xFF);
    crc = crcTable[idx] ^ ((crc << 8) & 0xFFFF);
  }
  return crc & 0xFFFF;
}

/**
 * Helper: convert length thành 2 ký tự
 */
function convertLength(s) {
  const len = s.length;
  if (len > 99) throw new Error('Field length too long (max 99).');
  return String(len).padStart(2, '0');
}

/**
 * Class VietQR
 */
class VietQR {
  constructor(bankBin, accountNo, beneficiaryName) {
    this.payloadFormatIndicator = "000201";
    this.pointOfInitiationMethod = "010212";
    this.transactionCurrency = "5303704";
    this.countryCode = "5802VN";
    this.additionalDataFieldTemplate = "62100707QRCode";
    this.bankBin = bankBin;
    this.accountNo = accountNo;
    this.beneficiaryName = beneficiaryName;
    this.transactionAmount = "";
    this.consumerAccountInformation = "";
  }

  setTransactionAmount(amount) {
    const len = convertLength(amount);
    this.transactionAmount = `54${len}${amount}`;
    return this;
  }

  setBeneficiaryOrganization(identifier) {
    const bankData = `00${convertLength(this.bankBin)}${this.bankBin}`;
    const accData = `01${convertLength(this.accountNo)}${this.accountNo}`;
    const nameData = `02${convertLength(this.beneficiaryName)}${this.beneficiaryName}`;
    const idData = `03${convertLength(identifier)}${identifier}`;

    const value = bankData + accData + nameData + idData;
    const total = convertLength(value);
    this.consumerAccountInformation = `38${total}${value}`;
    return this;
  }

  build() {
    const content =
      this.payloadFormatIndicator +
      this.pointOfInitiationMethod +
      this.consumerAccountInformation +
      this.transactionCurrency +
      this.transactionAmount +
      this.countryCode +
      this.additionalDataFieldTemplate +
      "6304";

    const crc = calcCRC(content).toString(16).toUpperCase().padStart(4, '0');
    return content + crc;
  }

  async generateQRCode(outputFile = 'vietqr.png') {
    const content = this.build();
    await QRCode.toFile(outputFile, content, {
      errorCorrectionLevel: 'M',
      scale: 8
    });
    console.log('✅ QR code generated at', outputFile);
  }
}

// Ví dụ sử dụng
const vietqr = new VietQR("970415", "0123456789", "NGUYEN VAN A")
  .setBeneficiaryOrganization("MB Bank")
  .setTransactionAmount("50000");

console.log("QR content:", vietqr.build());
await vietqr.generateQRCode("vietqr.png");
