import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { WeddingGuestService } from '../src/wedding-guest/wedding-guest.service';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(WeddingGuestService);

  const csvPath = path.join(process.cwd(), 'data', 'invitados.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  
  if (lines.length < 2) {
    console.log('CSV empty or just header.');
    process.exit(0);
  }

  // Extract header and ignore it for data mapping
  const [headerLine, ...dataLines] = lines;
  const headers = headerLine.toLowerCase().split(',').map(h => h.trim());
  
  const nameIdx = headers.findIndex(h => h.includes('nombre') || h.includes('name'));
  const plusOneIdx = headers.findIndex(h => h.includes('adicionales') || h.includes('plus'));

  if (nameIdx === -1) {
    console.error('Could not find "nombre" column in CSV header: ' + headerLine);
    process.exit(1);
  }

  const rows = dataLines.reduce((acc, line) => {
    const cols = line.split(','); 
    
    // User requirement: First column must be "true" to import
    if (cols[0]?.trim().toLowerCase() !== 'true') {
        return acc;
    }

    const nombre = cols[nameIdx]?.trim();
    const adicionales = plusOneIdx !== -1 ? parseInt(cols[plusOneIdx]?.trim(), 10) : 0;

    if (nombre) {
      acc.push({
        nombre,
        adicionales: adicionales || 0
      });
    }
    return acc;
  }, [] as Array<{ nombre: string; adicionales: number }>);

  console.log(`Found ${rows.length} rows. Importing...`);
  
  try {
    await service.importFromCsv(rows);
    console.log('Import completed successfully.');
  } catch (err) {
    console.error('Import failed:', err);
  } finally {
    await app.close();
  }
}

bootstrap();
