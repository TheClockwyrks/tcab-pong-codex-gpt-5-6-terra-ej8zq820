# Carom

Carom is a fast top-down paddle duel. Bend the ball with paddle motion, bank it
off the central obstacles, and out-rally your opponent.

## Run it

Install dependencies with `npm ci`, then start the development server with
`npm run dev`. Build the static production site with `npm run build`; it is
written to `dist/` and can be served by any static web server.

## Controls

- Player one: `W` / `S`
- Player two (Versus): Up / Down arrows
- Confirm menu selection: `Enter` or `Space`
- Pause: `P` or `Escape`
- Toggle sound: `M`

Solo controls the cyan paddle against the vector AI. Versus puts a second local
player on the pink paddle. First to 11 wins, with a two-point lead required.
