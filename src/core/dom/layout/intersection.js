import {Deferred} from '#core/data-structures/promise';
import {dict} from '#core/types/object';
import {getWin} from '#core/window';

import {LayoutRectDef, layoutRectFromDomRect} from './rect';
import {createViewportObserver} from './viewport-observer';

/** @type {!WeakMap<!Element, !Deferred<!IntersectionObserverEntry>>|undefined} */
let intersectionDeferreds;

/** @type {!WeakMap<!Window, !IntersectionObserver>|undefined} */
let intersectionObservers;

/**
 * @param {!Window} win
 * @return {!IntersectionObserver}
 */
function getInOb(win) {
  if (!intersectionDeferreds) {
    intersectionDeferreds = new WeakMap();
    intersectionObservers = new WeakMap();
  }

  let observer = intersectionObservers.get(win);
  if (!observer) {
    observer = createViewportObserver(
      (entries) => {
        const seen = new Set();
        for (let i = entries.length - 1; i >= 0; i--) {
          const {target} = entries[i];
          if (seen.has(target)) {
            continue;
          }
          seen.add(target);

          observer.unobserve(target);
          intersectionDeferreds.get(target).resolve(entries[i]);
          intersectionDeferreds.delete(target);
        }
      },
      win,
      {needsRootBounds: true}
    );
    intersectionObservers.set(win, observer);
  }
  return observer;
}

/**
 * Returns a promise that resolves with the intersection entry for the given element.
 *
 * If multiple measures for the same element occur very quickly, they will
 * dedupe to the same promise.
 *
 * @param {!Element} el
 * @return {!Promise<!IntersectionObserverEntry>}
 */
export function measureIntersection(el) {
  if (intersectionDeferreds && intersectionDeferreds.has(el)) {
    return intersectionDeferreds.get(el).promise;
  }

  const inOb = getInOb(getWin(el));
  inOb.observe(el);

  const deferred = new Deferred();
  intersectionDeferreds.set(el, deferred);
  return deferred.promise;
}

/**
 * Convert an IntersectionObserverEntry to a regular object to make it serializable.
 *
 * @param {!IntersectionObserverEntry} entry
 * @return {!JsonObject}
 */
export function intersectionEntryToJson(entry) {
  return dict({
    'time': entry.time,
    'rootBounds': safeLayoutRectFromDomRect(entry.rootBounds),
    'boundingClientRect': safeLayoutRectFromDomRect(entry.boundingClientRect),
    'intersectionRect': safeLayoutRectFromDomRect(entry.intersectionRect),
    'intersectionRatio': entry.intersectionRatio,
  });
}

/**
 * @param {?} rect
 * @return {?LayoutRectDef}
 */
function safeLayoutRectFromDomRect(rect) {
  if (rect === null) {
    return null;
  }
  return layoutRectFromDomRect(/** @type {!ClientRect} */ (rect));
}
