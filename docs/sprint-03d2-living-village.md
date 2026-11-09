# Sprint 03D.2 — Living Village NPCs

Adds two **fictional present-day villagers** to the playable area near the player spawn. The villagers automatically alternate between short local patrol routes and resting, using a deterministic, testable TypeScript service rather than random movement.

## Implementation

- `VillageNpcService` owns NPC waypoints, activity, facing direction and bounded time-step updates.
- `VillageScene` draws characters with the existing chibi frames (tinted distinctly), animates walking, renders a legible label and updates visual depth based on foot-point Y.
- Each movement step is tested against the same `NavigationService` used for the player, including new scene obstacles from Sprint 03D.1.
- An obstructed NPC never phases through an object; it pauses and advances to a different waypoint. This is **local obstacle-aware patrolling, not full A* pathfinding**.
- NPCs are present-day illustrative inhabitants only. They are hidden and paused for historical interpretation eras; no false historical people are introduced.
- `prefers-reduced-motion: reduce` keeps ambient NPCs resting instead of endlessly walking.
- Existing 12-toggle screenshot hash QA uses reduced motion to keep static world comparisons deterministic.

## Testing and acceptance

- `npm run check`
- `npm run test:e2e`
- Verify two inhabitants visibly walk/rest without crossing water, trees or houses.
- Check mobile and desktop and confirm historical era hides villagers.
- Confirm the player can still access the guide, three heritage markers and portal.
- Test with reduced motion enabled and when chibi SVG cannot load.

The branch is stacked on Sprint 03D.1 PR #11 and must not be merged before that PR passes testing. No real-life NPC or reconstructed historical profession is claimed.
