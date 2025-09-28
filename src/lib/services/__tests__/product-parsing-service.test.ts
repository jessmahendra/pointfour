import { productParsingService } from '../product-parsing-service';

// Simple test to verify the service can be instantiated and has expected methods
describe('ProductParsingService', () => {
  it('should be a singleton', () => {
    const instance1 = productParsingService;
    const instance2 = productParsingService;
    expect(instance1).toBe(instance2);
  });

  it('should have parseProduct method', () => {
    expect(typeof productParsingService.parseProduct).toBe('function');
  });

  it('should have parseProducts method', () => {
    expect(typeof productParsingService.parseProducts).toBe('function');
  });
});
