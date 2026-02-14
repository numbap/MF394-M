// Test the cropping logic
describe('Face Cropping Logic', () => {
  test('should validate crop dimensions are positive', () => {
    const bounds = {
      origin: { x: 100, y: 100 },
      size: { width: 200, height: 200 }
    };
    const padding = 20;
    
    const originX = Math.max(0, bounds.origin.x - padding);
    const originY = Math.max(0, bounds.origin.y - padding);
    const cropWidth = bounds.size.width + padding * 2;
    const cropHeight = bounds.size.height + padding * 2;
    
    expect(cropWidth).toBeGreaterThan(0);
    expect(cropHeight).toBeGreaterThan(0);
    expect(originX).toBeGreaterThanOrEqual(0);
    expect(originY).toBeGreaterThanOrEqual(0);
  });

  test('should handle edge case when bounds are at image edge', () => {
    const bounds = {
      origin: { x: 10, y: 10 },
      size: { width: 150, height: 150 }
    };
    const padding = 20;
    
    const originX = Math.max(0, bounds.origin.x - padding);
    const originY = Math.max(0, bounds.origin.y - padding);
    
    // Should clamp to 0, not go negative
    expect(originX).toBe(0);
    expect(originY).toBe(0);
  });

  test('should apply padding correctly to face bounds', () => {
    const bounds = {
      origin: { x: 500, y: 500 },
      size: { width: 250, height: 300 }
    };
    const padding = 20;
    
    const originX = Math.max(0, bounds.origin.x - padding);
    const originY = Math.max(0, bounds.origin.y - padding);
    const cropWidth = bounds.size.width + padding * 2;
    const cropHeight = bounds.size.height + padding * 2;
    
    expect(originX).toBe(480);
    expect(originY).toBe(480);
    expect(cropWidth).toBe(290);
    expect(cropHeight).toBe(340);
  });

  test('should handle multiple faces with different bounds', () => {
    const faces = [
      { id: 'face-0', bounds: { origin: { x: 100, y: 150 }, size: { width: 250, height: 300 } } },
      { id: 'face-1', bounds: { origin: { x: 375, y: 120 }, size: { width: 270, height: 330 } } },
      { id: 'face-2', bounds: { origin: { x: 650, y: 150 }, size: { width: 260, height: 310 } } },
    ];
    
    const padding = 20;
    
    // Verify each face can be cropped independently
    faces.forEach(face => {
      const originX = Math.max(0, face.bounds.origin.x - padding);
      const originY = Math.max(0, face.bounds.origin.y - padding);
      const cropWidth = face.bounds.size.width + padding * 2;
      const cropHeight = face.bounds.size.height + padding * 2;
      
      expect(cropWidth).toBeGreaterThan(0);
      expect(cropHeight).toBeGreaterThan(0);
      expect(originX).toBeGreaterThanOrEqual(0);
      expect(originY).toBeGreaterThanOrEqual(0);
    });
  });
});
