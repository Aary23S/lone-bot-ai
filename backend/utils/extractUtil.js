// ✅ backend/utils/extractUtil.js

const fs = require('fs');
const pdfParse = require('pdf-parse');
const csv = require('csv-parser');
const ExcelJS = require('exceljs');
const path = require('path');
const mammoth = require('mammoth'); // ✅ for .docx

exports.extractTextFromFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  if (ext === '.csv') {
    return await extractCSV(filePath);
  }

  if (ext === '.xlsx' || ext === '.xls') {
    return await extractExcel(filePath);
  }

  if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf8'); // ✅ plain text
  }

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath }); // ✅ docx text
    return result.value;
  }

  return '';
};

// CSV Parser
const extractCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(Object.values(data).join(' ')))
      .on('end', () => resolve(results.join('\n')))
      .on('error', reject);
  });
};

// Excel Parser
const extractExcel = async (filePath) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  let text = '';

  workbook.eachSheet((sheet) => {
    sheet.eachRow((row) => {
      text += row.values.join(' ') + '\n';
    });
  });

  return text;
};
