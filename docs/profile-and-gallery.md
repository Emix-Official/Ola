# Profile and project gallery

This update builds on commit `8877504` (the commit containing both original portraits).
It adds the portrait/bio section, Upright, a filterable gallery, email controls, a
one-page CV, and small interaction animations. It requires no new npm dependencies.

## How the portrait works

`App` already owns the theme. It passes that same value into `About` and
`ThemePortrait`. Two aligned images occupy the same 9:16 frame; `data-active`
controls their opacity. The picture changes underneath the existing gold curtain,
so the page and outfit switch together. There is no second theme state to drift
out of sync. Only the active photo has alternative text.

The original photos remain in their existing public folder. Responsive WebP
copies live in `public/portraits`: the browser chooses a 480px or 900px image.
The four files total about 205 KB; a visitor normally downloads one responsive
size of each photo. Both theme images are lazy-loaded near the section.

`useCoreMotion(0.35)` reuses the existing smoothed pointer/device controller at
35% strength. The hero still uses its original strength. Phone tilt begins only
with the portrait's Enable button, supports recentering, and pauses offscreen or
when the tab is hidden. A reduced-motion preference disables motion. Desktop
mouse movement needs no device permission.

## Edit your bio or contact details

`src/data/profile.ts` contains the bio, email, social links, and CV path. The email
is shared by the displayed address, mail link, and copy button. Clipboard errors
show a useful message and leave the address available for manual copying.

The contact form remains a mail link; it does not pretend to send a message from
the website. The existing close, minimize, and expand controls remain intact.

## Add another project

Add an object to the array in `src/data/projects.ts`. Keep `projects.ts` for project
data, and keep theme logic in `src/hooks/useTheme.ts`.

```ts
{
  id: 'your-project', // unique, stable, lowercase
  name: 'Your project',
  category: '3D / Animation',
  disciplines: ['3d', 'motion'],
  status: 'Visual study',
  headline: 'A short description of what you made.',
  summary: 'What someone can explore and why you made it.',
  story: 'Your role, choices, and what you learned.',
  tools: ['Blender'],
  image: {
    src: 'projects/your-project.webp',
    alt: 'Describe the actual image.',
    width: 1600,
    height: 900,
  },
  imageCaption: 'Blender render',
  url: 'https://your-live-project.example',
  linkLabel: 'Explore the project',
},
```

Replace the example URL and image with your real assets before adding it.
The example dimensions must match the actual image. Valid disciplines are
`software`, `3d`, and `motion`; one project can belong to several.

Set `featured: true` to place it in Selected Work. Otherwise it appears in Further
Explorations. Keep roughly three featured projects so the opening section stays
focused. The gallery has no fixed slot limit, and filter counts update from the
data. A project without an image receives a labelled text cover. The Upright
illustration is explicitly labelled as a concept, not an actual app screenshot.

The racing project links back to the existing film/3D section, reusing its poster
without loading a second video player or WebGL renderer in the gallery.

## Updating the CV

The download lives at `public/documents/olaoluwa-abiodun-cv.pdf`. You may replace
that file with another PDF and the site links will continue to work.

For the included editable source, update the text in `scripts/build-cv.py`, then:

```sh
python3 -m venv .venv-cv
.venv-cv/bin/pip install reportlab
.venv-cv/bin/python scripts/build-cv.py
```

The script uses DejaVu Sans if available and otherwise Helvetica. Font changes can
alter wrapping: open the regenerated PDF and check the page count before publishing.
The PDF is already included; Python is not required to build or host the website.
Do not commit the local virtual environment.

## Motion and accessibility

`Reveal` uses IntersectionObserver to reveal a section once. Content is visible
by default, stays visible without observation support, and appears immediately
when reached by keyboard or when reduced motion is enabled. Only small opacity
and position changes are used; the new gallery adds no continuous animation loop.

Filter buttons use `aria-pressed` and a live project count. The MarkOS name story
uses a native details/summary disclosure. Download and email links work as normal
links. New narrow-screen layouts use a single column.

## Validation

Run `npm run build`, `npm run lint`, and `npm run test:race`. The existing Three.js
chunk warning remains: the viewer is still loaded on demand.

The editing environment blocked the local browser preview. Build/lint and the
existing race regression tests pass, but visual behavior and physical sensors
still need checking on a real browser/device:

- Switch themes with the portrait visible. Confirm the outfit changes with it.
- At phone width, confirm no horizontal overflow and readable contact links.
- Enable portrait tilt on HTTPS, move gently, recenter, and disable it.
- Enable Reduce Motion: the portrait should stay still and all text stay visible.
- Try Software, 3D, Motion, and All filters, then follow a project link.
- Copy the email and paste it locally; open/download the CV.
