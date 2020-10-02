"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const autocomplete_1 = require("./autocomplete");
describe('autocomplete', () => {
    it('buildSearchRegions should return a promise', async () => {
        const fn = autocomplete_1.buildSearchRegions();
        const res = await fn({}, 'ap');
        expect(Array.isArray(res)).toBeTruthy();
        expect(res.length > 0).toBeTruthy();
    });
});
describe('autocomplete with empty input', () => {
    it('buildSearchRegions should return a promise', async () => {
        const fn = autocomplete_1.buildSearchRegions();
        const res = await fn({}, '');
        expect(Array.isArray(res)).toBeTruthy();
        expect(res.length > 0).toBeTruthy();
    });
});
//# sourceMappingURL=autocomplete.test.js.map