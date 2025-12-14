const fs = require('fs');
const path = require('path');

// Read CSV file
const csvPath = '/Users/hiro/Downloads/tonmana_625.csv';
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV (handle quoted fields with commas)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

const lines = csvContent.trim().split('\n');
const headers = parseCSVLine(lines[0]);

// Generate TypeScript code
let tsCode = `// Auto-generated from tonmana_625.csv
// DO NOT EDIT MANUALLY

export interface TonmanaStyleEntry {
  name: string
  hue: string
  bgNormal: string
  bgCover: string
  headingColor: string
  textColor: string
  fontHeading: string
  fontBody: string
  letterSpacing: string
}

export const tonmanaStyles: Record<string, TonmanaStyleEntry> = {
`;

for (let i = 1; i < lines.length; i++) {
  const values = parseCSVLine(lines[i]);
  if (values.length < 14) continue;
  
  const code = values[0];           // code
  const name = values[5];           // name
  const hue = values[7];            // hue
  const bgNormal = values[8];       // bg_normal
  const bgCover = values[9];        // bg_cover
  const headingColor = values[10];  // heading_color
  const textColor = values[11];     // text_color
  const fontHeading = values[12];   // font_heading
  const fontBody = values[13];      // font_body
  const letterSpacing = values[14] || '0'; // letter_spacing
  
  // Escape quotes in values
  const escape = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  
  tsCode += `  '${code}': {
    name: '${escape(name)}',
    hue: '${escape(hue)}',
    bgNormal: '${escape(bgNormal)}',
    bgCover: '${escape(bgCover)}',
    headingColor: '${escape(headingColor)}',
    textColor: '${escape(textColor)}',
    fontHeading: '${escape(fontHeading)}',
    fontBody: '${escape(fontBody)}',
    letterSpacing: '${escape(letterSpacing)}',
  },
`;
}

tsCode += `}
`;

// Write TypeScript file
const outputPath = path.join(__dirname, '../src/constants/tonmanaStyles.ts');
fs.writeFileSync(outputPath, tsCode);

console.log(`Generated ${lines.length - 1} entries to ${outputPath}`);
