import { expect, type Page } from '@playwright/test';

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

/** Solves the adult challenge the way an adult would: read the words, do the maths. */
export async function solveGate(page: Page) {
  const prompt = await page.locator('label[for="gate-answer"]').innerText();
  const m = prompt.match(/What is (\w+) times (\w+), plus (\w+)\?/)!;
  const [a, b, c] = [m[1], m[2], m[3]].map((w) => WORDS.indexOf(w!));
  await page.fill('#gate-answer', String(a! * b! + c!));
  await page.getByRole('button', { name: 'Check', exact: true }).click();
}

export async function onboard(page: Page, opts: { goals?: string[] } = {}) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: /start the adult check/ }).click();
  await solveGate(page);
  await page.getByLabel(/I am this child's parent or guardian/).check();
  await page.getByRole('button', { name: 'I agree' }).click();
  await page.getByLabel('Nickname (optional)').fill('Sam');
  await page.getByRole('button', { name: '2–4 years' }).click();
  await page.getByRole('button', { name: 'Few or no words yet' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  for (const g of opts.goals ?? []) await page.getByLabel(g).check();
  await page.getByRole('button', { name: opts.goals?.length ? 'Save goals' : 'Later' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText("Today's plan");
}

export async function enterChildMode(page: Page) {
  await page.evaluate(() => { location.hash = '#/today'; });
  await page.getByRole('button', { name: 'Child Mode' }).click();
  const start = page.getByRole('button', { name: 'Start Child Mode' });
  await expect(page.getByTestId('stopbar').or(start)).toBeVisible();
  if (await start.isVisible()) await start.click();
  await expect(page.getByTestId('stopbar')).toBeVisible();
}

export async function holdGrownUps(page: Page) {
  const box = (await page.getByTestId('grownups').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2300);
  await page.mouse.up();
}

export const storage = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('harmony.v1') ?? 'null'));
