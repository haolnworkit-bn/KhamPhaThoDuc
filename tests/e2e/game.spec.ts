import { expect, test } from '@playwright/test';

const saveKey = 'tho-duc-time-journey:save';
const makeSave = (overrides: Record<string, unknown> = {}) => ({
  schemaVersion: 2,
  player: { mapId: 'tho_duc_geographic_v1', x: 519, y: 1060 },
  activeEra: 'present',
  quest: { guideSpoken: true, visitedLocations: [], portalUsed: false, completed: false },
  discoveredLocations: [],
  started: true,
  navigationTarget: null,
  ...overrides,
});

const canvasPixelHash = (page: import('@playwright/test').Page) => page.locator('canvas').evaluate((element) => {
  const canvas = element as HTMLCanvasElement;
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
  if (!gl) throw new Error('Expected Phaser to use a WebGL canvas');
  const pixels = new Uint8Array(canvas.width * canvas.height * 4);
  gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  let hash = 2166136261;
  for (const byte of pixels) { hash ^= byte; hash = Math.imul(hash, 16777619); }
  return `${canvas.width}x${canvas.height}:${hash >>> 0}`;
});

test('mở trang và bắt đầu một phiên chơi', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /Thọ Đức/ })).toBeVisible();
  await page.getByRole('button', { name: 'Bắt đầu khám phá' }).click();
  await expect(page.getByLabel('Bản đồ địa lý Thọ Đức')).toBeVisible();
  await expect(page.getByText(/Bản đồ địa lý khái quát/)).toBeVisible();
  await expect(page.getByLabel('Bản đồ Thọ Đức')).toBeVisible();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(250);
  await page.keyboard.up('ArrowRight');
  await expect(page.locator('canvas')).toBeVisible();
});

test('tải artwork SVG gốc và vẫn chơi được khi một ảnh trang trí lỗi', async ({ page }) => {
  const requested = [
    '/assets/environment/tree-v1.svg',
    '/assets/environment/house-v1.svg',
    '/assets/heritage/dinh-tho-duc-v1.svg',
  ];
  const served = new Set<string>();
  await page.route('**/assets/**/*.svg', async (route) => {
    const url = new URL(route.request().url());
    if (requested.some((path) => url.pathname.endsWith(path))) served.add(url.pathname);
    if (url.pathname.endsWith('/assets/environment/house-v1.svg')) {
      await route.fulfill({ status: 503, contentType: 'image/svg+xml', body: '' });
      return;
    }
    await route.continue();
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Bắt đầu khám phá' }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect.poll(() => served.size).toBe(3);
  await expect(page.getByRole('button', { name: /Nhật ký/ })).toBeVisible();
});

test('nhân vật SVG có thể lỗi tải mà game vẫn khởi động được', async ({ page }) => {
  await page.route('**/assets/characters/player-chibi-v1.svg', (route) =>
    route.fulfill({ status: 503, contentType: 'image/svg+xml', body: '' }));
  await page.goto('./');
  await page.getByRole('button', { name: 'Bắt đầu khám phá' }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(220);
  await page.keyboard.up('ArrowRight');
  await expect(page.getByRole('button', { name: /Nhật ký/ })).toBeVisible();
});

test('báo lỗi khi không thể tải Asset Registry', async ({ page }) => {
  await page.route('**/data/asset-manifest.json', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Không thể khởi động' })).toBeVisible();
  await expect(page.getByText(/Unable to load visual metadata \(503\)/)).toBeVisible();
});

test('báo lỗi rõ ràng khi không thể tải Map Visual Style Registry bắt buộc', async ({ page }) => {
  await page.route('**/data/map-visual-styles.json', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Không thể khởi động' })).toBeVisible();
  await expect(page.getByText(/Unable to load map visual styles \(503\)/)).toBeVisible();
});

test('vẫn bắt đầu được khi không thể tải Scene Decoration Registry', async ({ page }) => {
  await page.route('**/data/scene-decorations.json', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await page.goto('./');
  await expect(page.getByRole('status')).toContainText('Trang trí cảnh chưa tải được');
  await page.getByRole('button', { name: 'Bắt đầu khám phá' }).click();
  await expect(page.locator('canvas')).toBeVisible();
});

test('minimap chọn điểm đến và hiển thị khoảng cách', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Bắt đầu khám phá' }).click();
  const mapPanel = page.getByLabel('Bản đồ Thọ Đức');
  const toggle = mapPanel.getByRole('button', { name: /Bản đồ/ });
  if (await toggle.isVisible()) await toggle.click();
  await mapPanel.getByRole('button', { name: 'Đền Can Vang' }).click();
  await expect(mapPanel.getByText(/m theo tỷ lệ bản đồ/)).toBeVisible();
});

test('di chuyển thực tế tới NPC, ba di tích và cổng thời gian', async ({ page }) => {
  const targets = [
    { start: { x: 519, y: 1145 }, key: 'ArrowUp', prompt: 'Khám phá' },
    { start: { x: 1500, y: 783 }, key: 'ArrowRight', prompt: 'Khám phá' },
    { start: { x: 643, y: 847 }, key: 'ArrowUp', prompt: 'Khám phá' },
    { start: { x: 619, y: 1216 }, key: 'ArrowRight', prompt: 'Trò chuyện' },
    { start: { x: 1597, y: 856 }, key: 'ArrowRight', prompt: 'Du hành thời gian', unlocked: true },
  ];
  for (const target of targets) {
    const progress = target.unlocked ? {
      quest: { guideSpoken: true, visitedLocations: ['dinh_tho_duc', 'den_can_vang', 'chua_thap_linh'], portalUsed: false, completed: false },
      discoveredLocations: ['dinh_tho_duc', 'den_can_vang', 'chua_thap_linh'],
    } : {};
    await page.goto('./');
    await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: saveKey, value: makeSave({ player: { mapId: 'tho_duc_geographic_v1', ...target.start }, ...progress }) });
    await page.reload();
    await page.getByRole('button', { name: 'Tiếp tục' }).click();
    await expect(page.locator('canvas[data-game-ready="true"]')).toBeVisible({ timeout: 15000 });
    await page.keyboard.down(target.key);
    try {
      await expect(page.getByRole('button', { name: new RegExp(target.prompt) })).toBeVisible({ timeout: 5000 });
    } finally {
      await page.keyboard.up(target.key);
    }
  }
});

test('không thể đi xuyên qua sông khi giữ phím di chuyển', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: saveKey, value: makeSave({ player: { mapId: 'tho_duc_geographic_v1', x: 1550, y: 570 } }) });
  await page.reload();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(1200);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(1600);
  const savedX = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}').player?.x as number, saveKey);
  expect(savedX).toBeLessThan(1640);
});

test('mở bảng thông tin di sản và giữ tiến trình sau tải lại', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: saveKey, value: makeSave() });
  await page.reload();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect(page.getByRole('button', { name: /Khám phá/ })).toBeVisible();
  await page.getByRole('button', { name: /Khám phá/ }).click();
  await expect(page.getByRole('heading', { name: 'Đình Thọ Đức' })).toBeVisible();
  await page.getByRole('button', { name: 'Tiếp tục khám phá' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.getByRole('button', { name: /Nhật ký/ }).click();
  await expect(page.getByText('Đã khám phá:')).toBeVisible();
  await expect(page.locator('.journal-summary')).toContainText('1/3');
});

test('cổng đã mở cho phép đổi cảnh nhiều lần', async ({ page }, testInfo) => {
  const completedSave = makeSave({
    quest: { guideSpoken: true, visitedLocations: ['dinh_tho_duc', 'den_can_vang', 'chua_thap_linh'], portalUsed: false, completed: false },
    discoveredLocations: ['dinh_tho_duc', 'den_can_vang', 'chua_thap_linh'],
  });
  await page.goto('./');
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: saveKey, value: completedSave });
  await page.reload();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  const progressBefore = await page.evaluate((key) => {
    const save = JSON.parse(localStorage.getItem(key) ?? '{}');
    return { quest: save.quest, discoveredLocations: save.discoveredLocations };
  }, saveKey);
  const timeline = page.getByRole('button', { name: 'Chuyển đổi thời kỳ' });
  await page.waitForTimeout(500);
  const presentBefore = await page.locator('canvas').screenshot();
  const presentHashBefore = await canvasPixelHash(page);
  for (let index = 0; index < 12; index++) await timeline.click();
  await expect(page.locator('.game-shell')).toHaveClass(/era-present/);
  await page.waitForTimeout(500);
  const presentAfter = await page.locator('canvas').screenshot();
  const presentHashAfter = await canvasPixelHash(page);
  await testInfo.attach('present-before-era-switches', { body: presentBefore, contentType: 'image/png' });
  await testInfo.attach('present-after-era-switches', { body: presentAfter, contentType: 'image/png' });
  expect(presentHashAfter).toBe(presentHashBefore);
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowDown');
  await page.waitForTimeout(1600);
  const after = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), saveKey);
  expect({ quest: after.quest, discoveredLocations: after.discoveredLocations }).toEqual(progressBefore);
  expect(after.player.y).toBeGreaterThan(1060);
});

test('giao diện bản đồ và điều khiển vừa màn hình điện thoại', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'));
  await page.goto('./');
  await page.getByRole('button', { name: 'Bắt đầu khám phá' }).click();
  await expect(page.locator('.mobile-controls')).toBeVisible();
  const panel = page.getByLabel('Bản đồ Thọ Đức');
  await panel.getByRole('button', { name: /Bản đồ/ }).click();
  await expect(panel).toHaveClass(/expanded/);
  const box = await panel.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
});


test('giải mã văn hóa Thọ Đức chỉ mở sau khám phá và lưu thẻ kiến thức', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Bắt đầu khám phá' }).click();
  await page.getByRole('button', { name: 'Giải mã quê hương' }).click();
  await expect(page.getByRole('heading', { name: 'Giải mã Thọ Đức' })).toBeVisible();
  await expect(page.getByText('0/4 thẻ kiến thức')).toBeVisible();
  await expect(page.getByText(/Hãy trò chuyện với Người dẫn chuyện/)).toBeVisible();
  await page.getByRole('button', { name: 'Quay lại khám phá' }).click();

  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: saveKey, value: makeSave(),
  });
  await page.reload();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.getByRole('button', { name: 'Giải mã quê hương' }).click();
  await page.getByRole('button', { name: 'Làng Quả Cảm' }).click();
  await expect(page.getByText(/Chưa chính xác/)).toBeVisible();
  await expect(page.getByText('0/4 thẻ kiến thức')).toBeVisible();
  await page.getByRole('button', { name: 'Làng Triền' }).click();
  await expect(page.getByText(/Đã giải mã manh mối/)).toBeVisible();
  await expect(page.getByText('1/4 thẻ kiến thức')).toBeVisible();
  await expect(page.getByRole('link', { name: /Đọc tư liệu gốc/ })).toHaveAttribute('href', /^https:\/\//);
  await page.getByRole('button', { name: 'Quay lại khám phá' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.getByRole('button', { name: 'Giải mã quê hương' }).click();
  await expect(page.getByText('1/4 thẻ kiến thức')).toBeVisible();
});
