# Resilience Theatre

Open **Resilience Theatre** in the workspace sidebar. Start Scenario plays a 115-second fictional incident. The speed control changes presentation time. The engineering clock independently maps transit and work to assumed hours. Seeking or changing the camera preserves the analytical state. The JSON button exports the decision record at the selected time.

## Architecture

- `data/theatre/passage.json` defines the fictional physical links, service demand, ratings, policies and approvals. Zod checks types, bounds, identifiers, loads and graph references in `lib/theatre/schema.ts`. The application and read-only GET endpoint at `/api/theatre` use the same parsed input.
- `route-planner.ts` enumerates simple paths on a bounded teaching graph (up to eight nodes and sixteen links). It sorts by total one-way delay and stable edge IDs. Priority-ordered allocation retains unaffected flows and consumes residual capacity on each traversed edge. Both directions share a physical edge budget. Missing capacity, policy and shared-risk exclusions appear in the candidate list. This greedy policy does not optimize global multicommodity throughput.
- `repair-planner.ts` checks permit, weather height, assumed work window and depth ratings. `machine.ts` generates guarded transitions. Physical repair, alternative service, and cutback are distinct. The optical-test and post-lay survey outcomes and simulated human permission are explicit inputs.
- `clock.ts` maps presentation seconds to engineering time. `engine.ts` reconstructs events and allocations from the fixture and selected instant. The seed identifies the scenario; this fixture has no random draws.
- `components/theatre` owns the procedural globe, vessel, tethered ROV, deck workbench, camera director, route map, controls and export. The persistent renderer updates when the snapshot or viewport changes. Reduced motion suppresses secondary movement. The SVG network and controls remain available without WebGL.
- The 3D globe loads the same Model 1 glTF and coloured cable ribbons used on Network Overview. The fault beacon and service overlay come from the fictional fixture. Drag or use the arrow keys to orbit; scroll or use +/− to zoom, and Home to reset. It uses no operator data, writable dataset endpoints or network control interfaces.

## Synthetic example

| Stage | Served | Unserved | Weighted one-way delay |
| --- | ---: | ---: | ---: |
| Baseline | 6 Tbps | 0 Tbps | 42 ms |
| Fault before activation | 0 Tbps | 6 Tbps | undefined |
| Alternate service | 5 Tbps | 1 Tbps | 69.4 ms |
| Approved cutback | 6 Tbps | 0 Tbps | 42 ms |

The two alternate paths carry 3 and 2 Tbps. Each assumed segment delay has a ±2 ms illustrative bound. Path bounds sum segment bounds. Vessel transit is 180 nautical miles at 12 knots, followed by 48 assumed work hours. No probabilities, measured RTTs or live vessel positions enter these calculations.

## Reproduction

Use the repository checkout with Node and npm. This instance used Node 24.22.3. The lockfile references a mirror that returned HTTP 403 here. Use npm's registry-host override to retain integrity verification.

```sh
npm ci --replace-registry-host=always --registry=https://registry.npmjs.org
npm run test:theatre
npm run lint
npm run build
npm run type-check
npm start
```

With the production server running, execute the browser and legacy checks in another terminal.

```sh
CHROMIUM_PATH=/usr/bin/chromium npm run test:theatre:browser -- --output=/tmp/theatre-browser-results
node --import tsx scripts/verify-chatbot-and-redundancy.mjs
node scripts/test-multilingual-agents.mjs
```

Set THEATRE_URL to select a different application origin for the browser tests. The legacy scripts use port 3000.

## Verification on this branch

The existing checkout matched GitHub main at `3c2ed7f`. Baseline install succeeded with the registry override, and lint and type-check passed. The baseline production build failed during investigations route collection because its Supabase client required a URL at module import. The route now selects its existing in-memory fallback when configuration is absent. Direct Node execution of the old operational check failed on an extensionless TypeScript import. Running it with the tsx loader resolved that failure.

| Final check | Observed result |
| --- | --- |
| Next production build, standalone type-check and lint | Passed |
| Engine tests | 17 passed |
| Production Chromium browser tests | 3 passed |
| Existing operational checks with tsx | 30/30 passed |
| Existing multilingual checks | 4/4 passed |

Browser coverage includes start/pause, seek and reverse seek, keyboard range control, route selection, changing the camera, mobile viewport, reduced-motion setting, JSON download, read-only API behavior and WebGL failure. A 2.5-second headless Chromium sample counted about 20 rendered frames per second on the globe, matching the 50 ms playback update interval. Hardware device profiling and a screen-reader audit remain unverified. The ship launches an aerial UAV for surface reconnaissance before lowering its tethered ROV. All repair work uses procedural geometry and the optical test and cutback permission are scripted scenario inputs.
