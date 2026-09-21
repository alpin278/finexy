import assert from 'node:assert/strict';
import fs from 'node:fs';
import { autoMapping, classifyDuplicates, normalizeMoney, normalizeRows, parseCsv } from '../src/lib/bank-statement-import.ts';

const idr = parseCsv(fs.readFileSync('scripts/fixtures/phase31-semicolon-idr.csv', 'utf8'));
assert.equal(idr.delimiter, ';'); assert.equal(idr.rows.length, 5); assert.equal(idr.rows[1][1], 'Kopi, Jakarta');
assert.equal(normalizeMoney('Rp1.000.000,50'), '1000000.50'); assert.equal(normalizeMoney('1,000,000.50'), '1000000.50'); assert.equal(normalizeMoney('50.000 DR'), '50000'); assert.equal(normalizeMoney('12,34,56'), null);
const mapped = normalizeRows(idr, { date: 'Tanggal', description: 'Keterangan', debit: 'Debit', credit: 'Credit', reference: 'Reference', dateFormat: 'DD/MM/YYYY', signedAmount: 'positive_income' }, 'IDR', [{ id: 'income', name: 'Gaji', type: 'income' }, { id: 'expense', name: 'Kopi', type: 'expense' }]);
assert.equal(mapped.filter((row) => row.duplicateState === 'invalid').length, 2); assert.equal(mapped[0].type, 'income'); assert.equal(mapped[1].type, 'expense');
const duplicates = classifyDuplicates(mapped, [{ occurredAt: '2026-09-21T12:00:00Z', amount: '50000', type: 'expense', description: 'Kopi, Jakarta', reference: 'EXP-001', externalId: null }]);
assert.equal(duplicates[1].duplicateState, 'likely_duplicate'); assert.equal(duplicates[2].duplicateState, 'possible_duplicate', 'same merchant/amount with a different reference remains reviewable, never silently erased');
const comma = parseCsv(fs.readFileSync('scripts/fixtures/phase31-comma-international.csv', 'utf8')); assert.equal(comma.delimiter, ','); assert.equal(autoMapping(comma.headers).amount, 'Amount');
console.log('phase31 parser, normalization, and duplicate matrix passed');
