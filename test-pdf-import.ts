import * as pdfImport from 'pdf-parse';
const { PDFParse } = pdfImport;

console.log('PDFParse type:', typeof PDFParse);

async function test() {
  try {
    // Create a dummy buffer (empty PDF won't work but we just want to see if it's a class)
    const dummyBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
    const parser = new PDFParse({ data: dummyBuffer });
    console.log('Parser instance created');
    const textResult = await parser.getText();
    console.log('Text result:', textResult.text);
  } catch (err) {
    console.error('Error during test:', err);
  }
}

test();
