// router.ts
// Minimal hash-based router. No dependencies, matches the project's existing
// pattern of small functions that build/mount DOM (see components/*.ts).
//
// Usage:
//   registerRoute('/', renderHome);
//   registerRoute('/courses', renderCourses);
//   registerRoute('/courses/:id', renderCourseDetails);
//   startRouter();
//
// A route handler receives the matched params and an AbortSignal that fires
// when the user navigates away — handlers can use it to skip stale async work
// or tear down listeners/timers they registered.

export type RouteParams = Record<string, string>;
export type RouteHandler = (params: RouteParams, signal: AbortSignal) => void | (() => void);

interface CompiledRoute {
  pattern: string;
  segments: string[];
  handler: RouteHandler;
}

const routes: CompiledRoute[] = [];
let notFoundHandler: RouteHandler | null = null;
let currentCleanup: (() => void) | null = null;
let currentController: AbortController | null = null;

function requireElement<T extends Element>(element: T | null, id: string): T {
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }
  return element;
}

export function registerRoute(pattern: string, handler: RouteHandler): void {
  routes.push({
    pattern,
    segments: pattern.split('/').filter(Boolean),
    handler,
  });
}

export function registerNotFound(handler: RouteHandler): void {
  notFoundHandler = handler;
}

function matchRoute(path: string): { route: CompiledRoute; params: RouteParams } | null {
  const pathSegments = path.split('/').filter(Boolean);

  for (const route of routes) {
    if (route.segments.length !== pathSegments.length) continue;

    const params: RouteParams = {};
    let matched = true;

    for (let i = 0; i < route.segments.length; i++) {
      const routeSeg = route.segments[i];
      const pathSeg = pathSegments[i];

      if (routeSeg.startsWith(':')) {
        params[routeSeg.slice(1)] = decodeURIComponent(pathSeg);
      } else if (routeSeg !== pathSeg) {
        matched = false;
        break;
      }
    }

    if (matched) return { route, params };
  }

  return null;
}

function getPath(): string {
  const hash = window.location.hash.slice(1); // strip '#'
  return hash || '/';
}

function animateRouteShell(): void {
  const shell = document.querySelector<HTMLElement>('main') ?? document.body;
  shell.classList.remove('route-shell');
  void shell.offsetWidth;
  shell.classList.add('route-shell');
}

function runRoute(): void {
  // Tear down whatever the previous view registered, and cancel in-flight work.
  currentController?.abort();
  currentCleanup?.();
  currentCleanup = null;

  const controller = new AbortController();
  currentController = controller;

  const path = getPath();
  const match = matchRoute(path);

  window.scrollTo({ top: 0 });

  if (match) {
    const cleanup = match.route.handler(match.params, controller.signal);
    if (typeof cleanup === 'function') currentCleanup = cleanup;
  } else if (notFoundHandler) {
    const cleanup = notFoundHandler({}, controller.signal);
    if (typeof cleanup === 'function') currentCleanup = cleanup;
  }

  animateRouteShell();
}

export function navigate(path: string): void {
  const target = `#${path}`;
  if (window.location.hash === target) {
    runRoute(); // re-run even if same route (e.g. re-clicking nav)
  } else {
    window.location.hash = target;
  }
}

export function startRouter(): void {
  window.addEventListener('hashchange', runRoute);
  runRoute();
}

/** Convenience: get the #app mount element every view renders into. */
export function getAppRoot(): HTMLElement {
  return requireElement(document.getElementById('app'), 'app');
}
