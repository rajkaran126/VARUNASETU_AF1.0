import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test.use({
  launchOptions: {
    executablePath: process.env.CHROMIUM_PATH,
    args: ["--enable-unsafe-swiftshader"],
  },
  acceptDownloads: true,
});
const base = process.env.THEATRE_URL ?? "http://127.0.0.1:3000";
test("playback, scene selection, network state and reproducible export", async ({
  page,
  request,
}) => {
  test.setTimeout(90000);
  await page.goto(base + "/workspace/resilience-theatre", {
    waitUntil: "domcontentloaded",
  });
  const stage = page.locator(".theatre");
  await expect(
    stage.getByRole("heading", { name: "Pelagic Passage" }),
  ).toBeVisible();
  await stage.getByRole("button", { name: "Start Scenario" }).click();
  await stage.getByRole("button", { name: "Pause" }).click();
  const slider = stage.getByRole("slider");
  async function seek(value: number) {
    await slider.evaluate((el, value) => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(el, String(value));
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
  }
  await seek(28);
  await expect(
    stage
      .locator(".caption")
      .getByText("Alternate service active", { exact: true }),
  ).toBeVisible();
  await expect(stage.getByText("69.4 ms", { exact: true })).toBeVisible();
  await stage.getByRole("button", { name: /AX\/XD/ }).click();
  await stage.getByLabel("Camera view").selectOption("ROV");
  for (const [t, phase] of [
    [52, "Tethered descent"],
    [80, "Deck joint construction"],
    [92, "Cable re-lay"],
    [115, "Decision record"],
  ] as const) {
    await seek(t);
    await expect(
      stage.locator(".caption").getByRole("heading", { name: phase }),
    ).toBeVisible();
  }
  const pending = page.waitForEvent("download");
  await stage.getByText("Download decision JSON").click();
  const record = JSON.parse(
    await readFile((await (await pending).path())!, "utf8"),
  );
  expect(record.current.cutback).toBe(true);
  expect(record.disrupted.network.services[0].unserved).toBe(1);
  await seek(10);
  await expect(
    stage.locator(".caption").getByRole("heading", { name: "Physical fault" }),
  ).toBeVisible();
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(slider).toHaveValue("0");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await (await request.get(base + "/api/theatre")).json()).source).toBe(
    "SYNTHETIC",
  );
  expect((await request.post(base + "/api/theatre")).status()).toBe(405);
});

test("WebGL playback submits frames", async ({ page }) => {
  await page.addInitScript(() => {
    const proto = WebGL2RenderingContext.prototype,
      draw = proto.clear;
    let frames = 0;
    proto.clear = function (...args) {
      const result = draw.apply(this, args);
      if (
        this.canvas instanceof HTMLCanvasElement &&
        this.canvas.closest(".camera")
      ) {
        frames++;
        document.documentElement.dataset.gpuSamples = String(frames);
      }
      return result;
    };
  });
  await page.goto(base + "/workspace/resilience-theatre", {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("button", { name: "Start Scenario" }).click();
  const observed = await page.evaluate(async () => {
    const count = () =>
      Number(document.documentElement.dataset.gpuSamples ?? 0);
    const a = count(),
      start = performance.now();
    await new Promise((r) => setTimeout(r, 2500));
    return ((count() - a) * 1000) / (performance.now() - start);
  });
  console.log("Theatre rendered frames per second", observed);
  expect(observed).toBeGreaterThan(0);
});

test("software fallback keeps route analysis accessible", async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value: function (kind: string, ...args: unknown[]) {
        return kind.startsWith("webgl")
          ? null
          : Reflect.apply(orig, this, [kind, ...args]);
      },
    });
  });
  await page.goto(base + "/workspace/resilience-theatre", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByText(/3D unavailable/)).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "Synthetic network with direct and alternate routes",
    }),
  ).toBeVisible();
});

test("overview globe responds to orbit and zoom while the clock is paused",async({page})=>{
  const model=page.waitForResponse(r=>r.url().endsWith("/models/model1/globe_ribbons.gltf"));
  await page.goto(base+"/workspace/resilience-theatre",{waitUntil:"domcontentloaded"});
  expect((await model).ok()).toBe(true);
  const camera=page.locator(".camera canvas");
  await camera.waitFor();
  const bounds=(await camera.boundingBox())!;
  const x=bounds.x+bounds.width/2,y=bounds.y+bounds.height/2;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+80,y+25,{steps:8});await page.mouse.up();
  const rotated=await camera.screenshot();
  await page.mouse.wheel(0,-140);
  await expect.poll(async()=>!(await camera.screenshot()).equals(rotated)).toBe(true);
  const zoomed=await camera.screenshot();
  await page.keyboard.press("Home");
  await expect.poll(async()=>!(await camera.screenshot()).equals(zoomed)).toBe(true);
  await expect(page.getByRole("slider")).toHaveValue("0");
});

test("surface waves move independently of a paused scenario and respect reduced motion", async ({page})=>{
  await page.goto(base+"/workspace/resilience-theatre",{waitUntil:"domcontentloaded"});
  await page.getByLabel("Camera view").selectOption("Ship");
  const canvas=page.locator(".camera canvas");
  const bounds=(await canvas.boundingBox())!;
  const clip={x:bounds.x+bounds.width*.08,y:bounds.y+bounds.height*.71,width:70,height:28};
  const sample=()=>page.screenshot({clip});
  const initial=await sample();
  await expect.poll(async()=>!(await sample()).equals(initial)).toBe(true);
  await expect(page.getByRole("slider")).toHaveValue("0");
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.waitForTimeout(300);
  const still=await sample();
  await page.waitForTimeout(250);
  expect((await sample()).equals(still)).toBe(true);
});
