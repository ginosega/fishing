import assert from 'node:assert/strict';
import { retailerFor, isManufacturerUrl, inferKnownManufacturer } from './link-ui.js';

assert.deepEqual(retailerFor('https://a.co/d/example'), { id: 'amazon', label: 'Amazon' });
assert.deepEqual(retailerFor('https://www.amazon.com/dp/example'), { id: 'amazon', label: 'Amazon' });

assert.equal(retailerFor('https://www.rapala.com/us_en/832-advanced-superline'), null);
assert.equal(retailerFor('https://www.river2seausa.com/product/whopper-plopper-60/'), null);
assert.equal(retailerFor('https://seaguar.com/products/invizx'), null);
assert.equal(retailerFor('https://eagleclaw.com/products/eagle-claw-egg-sinkers'), null);

assert.equal(isManufacturerUrl('https://www.rapala.com/us_en/832-advanced-superline', 'Sufix'), true);
assert.equal(isManufacturerUrl('https://www.river2seausa.com/product/whopper-plopper-60/', 'River2Sea'), true);
assert.equal(isManufacturerUrl('https://eagleclaw.com/products/eagle-claw-egg-sinkers', 'Eagle Claw'), true);
assert.equal(isManufacturerUrl('https://thkfish.net/products/example', 'THKFISH'), true);
assert.equal(isManufacturerUrl('https://a.co/d/example', 'Sufix'), false);

assert.equal(inferKnownManufacturer('River2Sea / Whopper Plopper 60'), 'River2Sea');
assert.equal(inferKnownManufacturer('THKFISH / 28 pcs sinkers set'), 'THKFISH');
assert.equal(inferKnownManufacturer('Eagle Claw'), 'Eagle Claw');

console.log('Manufacturer link normalization regression tests passed.');
