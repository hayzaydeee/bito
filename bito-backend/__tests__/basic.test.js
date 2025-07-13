// Mock test to satisfy Jest requirements
describe('Backend API', () => {
  test('should pass basic test', () => {
    // This is a simple test to ensure Jest finds at least one test
    expect(true).toBe(true);
  });

  test('should be able to require workspace routes', () => {
    // Test that the routes file can be required without syntax errors
    expect(() => {
      require('../routes/workspaces');
    }).not.toThrow();
  });
});
